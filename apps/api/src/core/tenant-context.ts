import { Request } from 'express';
import { UserRole, Permission, hasPermission } from '@reservy/domain';

export interface UserContext {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isSuperAdmin: boolean;
  tenantId?: string;
  organizationId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
  organizationId?: string;
  tenantId?: string;
  correlationId?: string;
}

export function getTenantId(req: AuthenticatedRequest): string {
  const tenantId = req.tenantId || req.user?.tenantId;
  if (!tenantId) {
    throw new Error('Tenant context missing from request');
  }
  return tenantId;
}

export function getOrganizationId(req: AuthenticatedRequest): string {
  const orgId = req.organizationId || req.user?.organizationId;
  if (!orgId) {
    throw new Error('Organization context missing from request');
  }
  return orgId;
}
