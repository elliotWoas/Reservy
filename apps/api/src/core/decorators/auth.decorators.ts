import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Permission } from '@reservy/domain';
import { UserContext } from '../tenant-context';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSION_KEY = 'require_permission';
export const RequirePermission = (permission: Permission) => SetMetadata(PERMISSION_KEY, permission);

export const SUPERADMIN_KEY = 'require_superadmin';
export const RequireSuperAdmin = () => SetMetadata(SUPERADMIN_KEY, true);

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext | undefined;
    return data && user ? user[data] : user;
  }
);

export const CurrentOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.organizationId || request.user?.organizationId;
  }
);
