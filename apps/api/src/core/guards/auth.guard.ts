import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { JwtAuthGuard, generateToken, type JwtPayload } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { DomainError, DomainErrorCode } from '@reservy/domain';
import { UserContext } from '../tenant-context';

export { JwtAuthGuard, generateToken };
export type { JwtPayload };
export { PermissionsGuard };

// Backward compatibility aliases
export const AuthGuard = JwtAuthGuard;
export const PermissionGuard = PermissionsGuard;

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserContext | undefined;
    if (!user?.isSuperAdmin) {
      throw new DomainError(DomainErrorCode.FORBIDDEN_PERMISSION, 'دسترسی فقط برای مدیران کل پلتفرم مجاز است');
    }
    return true;
  }
}
