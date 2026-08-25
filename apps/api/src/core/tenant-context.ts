import { UserRole } from '@reservy/domain';
export interface UserContext { userId:string; email:string; fullName:string; role:UserRole; isSuperAdmin:boolean; tenantId?:string; organizationId?:string; }
export function getTenantId(r:{tenantId?:string;user?:UserContext}):string{const id=r.tenantId||r.user?.tenantId;if(!id)throw new Error('Tenant context missing from request');return id}
export function getOrganizationId(r:{organizationId?:string;user?:UserContext}):string{const id=r.organizationId||r.user?.organizationId;if(!id)throw new Error('Organization context missing from request');return id}
