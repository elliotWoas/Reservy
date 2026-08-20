import crypto from 'crypto';
import { prisma } from '@reservy/database';
import { UserRole, DomainError, DomainErrorCode } from '@reservy/domain';
import { RegisterInput, LoginInput } from '@reservy/validation';
import { generateToken } from '../../core/guards/auth.guard';

function hashPassword(password: string): string {
  const hasher = crypto.createHash('sha256');
  hasher.update(password + 'reservy-salt');
  return hasher.digest('hex');
}

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new DomainError(DomainErrorCode.USER_ALREADY_EXISTS, 'کاربری با این ایمیل قبلاً ثبت‌نام کرده است');
    }

    const existingSlug = await prisma.organization.findUnique({
      where: { slug: input.organizationSlug },
    });

    if (existingSlug) {
      throw new DomainError(DomainErrorCode.INVALID_INPUT, 'این شناسه آدرس (slug) قبلاً استفاده شده است');
    }

    const passwordHash = hashPassword(input.password);

    // Create Tenant, Organization, User, and Membership in a transaction
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          phone: input.phone,
          role: UserRole.OWNER,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: input.organizationName,
          slug: input.organizationSlug,
        },
      });

      const org = await tx.organization.create({
        data: {
          tenantId: tenant.id,
          name: input.organizationName,
          slug: input.organizationSlug,
          phone: input.phone,
          email: input.email,
        },
      });

      // Default main location
      await tx.location.create({
        data: {
          organizationId: org.id,
          name: 'شعبه مرکزی',
          phone: input.phone,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          organizationId: org.id,
          role: UserRole.OWNER,
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: UserRole.OWNER,
        isSuperAdmin: user.isSuperAdmin,
        tenantId: tenant.id,
        organizationId: org.id,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: UserRole.OWNER,
          isSuperAdmin: user.isSuperAdmin,
        },
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
      };
    });
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new DomainError(DomainErrorCode.INVALID_CREDENTIALS, 'ایمیل یا رمز عبور اشتباه است');
    }

    const passwordHash = hashPassword(input.password);
    if (user.passwordHash !== passwordHash) {
      throw new DomainError(DomainErrorCode.INVALID_CREDENTIALS, 'ایمیل یا رمز عبور اشتباه است');
    }

    const primaryMembership = user.memberships[0];
    const role = primaryMembership ? (primaryMembership.role as UserRole) : user.role;
    const organizationId = primaryMembership ? primaryMembership.organizationId : undefined;
    const tenantId = primaryMembership ? primaryMembership.tenantId : undefined;

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role,
      isSuperAdmin: user.isSuperAdmin,
      tenantId,
      organizationId,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
        isSuperAdmin: user.isSuperAdmin,
      },
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
      activeOrganizationId: organizationId,
    };
  }

  async getMe(userId: string, activeOrgId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new DomainError(DomainErrorCode.UNAUTHENTICATED, 'کاربر یافت نشد');
    }

    const activeMembership = activeOrgId
      ? user.memberships.find((m) => m.organizationId === activeOrgId) || user.memberships[0]
      : user.memberships[0];

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: activeMembership ? activeMembership.role : user.role,
      isSuperAdmin: user.isSuperAdmin,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
      activeOrganization: activeMembership ? activeMembership.organization : null,
    };
  }
}

export const authService = new AuthService();
