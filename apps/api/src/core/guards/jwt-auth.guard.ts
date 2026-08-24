import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, DomainError, DomainErrorCode } from '@reservy/domain';
import { ENV } from '../../config/env';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';
import { UserContext } from '../tenant-context';

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

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new DomainError(DomainErrorCode.UNAUTHENTICATED, 'احراز هویت ارسال نشده است');
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
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

      const requestedOrgId = request.headers['x-organization-id'] as string | undefined;
      let activeMembership = user.memberships.find((m) => m.organizationId === requestedOrgId);
      if (!activeMembership && user.memberships.length > 0) {
        activeMembership = user.memberships[0];
      }

      const role = activeMembership ? (activeMembership.role as UserRole) : (user.role as UserRole);
      const organizationId = activeMembership ? activeMembership.organizationId : decoded.organizationId;
      const tenantId = activeMembership ? activeMembership.tenantId : decoded.tenantId;

      const userContext: UserContext = {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
        isSuperAdmin: user.isSuperAdmin,
        tenantId,
        organizationId,
      };

      request.user = userContext;
      request.organizationId = organizationId;
      request.tenantId = tenantId;

      return true;
    } catch (err) {
      if (err instanceof DomainError) throw err;
      throw new DomainError(DomainErrorCode.UNAUTHENTICATED, 'توکن احراز هویت نامعتبر یا منقضی شده است');
    }
  }
}
