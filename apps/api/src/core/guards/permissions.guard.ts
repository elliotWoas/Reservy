import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasPermission, DomainError, DomainErrorCode } from '@reservy/domain';
import { PERMISSION_KEY, SUPERADMIN_KEY } from '../decorators/auth.decorators';
import { UserContext } from '../tenant-context';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<Permission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isSuperAdminRequired = this.reflector.getAllAndOverride<boolean>(SUPERADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserContext | undefined;

    if (!user) {
      throw new DomainError(DomainErrorCode.UNAUTHENTICATED, 'احراز هویت الزامی است');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    if (isSuperAdminRequired) {
      throw new DomainError(DomainErrorCode.FORBIDDEN_PERMISSION, 'دسترسی فقط برای مدیران کل پلتفرم مجاز است');
    }

    if (requiredPermission) {
      if (!hasPermission(user.role, requiredPermission)) {
        throw new DomainError(
          DomainErrorCode.FORBIDDEN_PERMISSION,
          `دسترسی لازم برای این عملیات (${requiredPermission}) را ندارید`
        );
      }
    }

    return true;
  }
}
