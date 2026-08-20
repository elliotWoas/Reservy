import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@reservy/database';
import { UserRole, Permission, hasPermission, DomainError, DomainErrorCode } from '@reservy/domain';
import { AuthenticatedRequest, UserContext } from '../tenant-context';
import { ENV } from '../../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  isSuperAdmin: boolean;
  tenantId?: string;
  organizationId?: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: DomainErrorCode.UNAUTHENTICATED,
        message: 'توکن احراز هویت ارسال نشده است',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    // Fetch user and active organization membership
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: DomainErrorCode.UNAUTHENTICATED,
          message: 'کاربر یافت نشد',
        },
      });
      return;
    }

    // Determine active organization: Header X-Organization-Id if provided and user is member, else first membership
    const requestedOrgId = req.headers['x-organization-id'] as string | undefined;
    let activeMembership = user.memberships.find((m) => m.organizationId === requestedOrgId);
    if (!activeMembership && user.memberships.length > 0) {
      activeMembership = user.memberships[0];
    }

    const role = activeMembership ? (activeMembership.role as UserRole) : (user.role as UserRole);
    const organizationId = activeMembership ? activeMembership.organizationId : decoded.organizationId;
    const tenantId = activeMembership ? activeMembership.tenantId : decoded.tenantId;

    req.user = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role,
      isSuperAdmin: user.isSuperAdmin,
      tenantId,
      organizationId,
    };
    req.organizationId = organizationId;
    req.tenantId = tenantId;

    next();
  } catch (err) {
    res.status(401).json({
      error: {
        code: DomainErrorCode.UNAUTHENTICATED,
        message: 'توکن احراز هویت نامعتبر یا منقضی شده است',
      },
    });
  }
}

export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: DomainErrorCode.UNAUTHENTICATED,
          message: 'احراز هویت الزامی است',
        },
      });
      return;
    }

    if (req.user.isSuperAdmin) {
      next();
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: {
          code: DomainErrorCode.FORBIDDEN_PERMISSION,
          message: `شما دسترسی لازم برای این عملیات (${permission}) را ندارید`,
        },
      });
      return;
    }

    next();
  };
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({
      error: {
        code: DomainErrorCode.FORBIDDEN_PERMISSION,
        message: 'دسترسی فقط برای مدیران کل پلتفرم مجاز است',
      },
    });
    return;
  }
  next();
}
