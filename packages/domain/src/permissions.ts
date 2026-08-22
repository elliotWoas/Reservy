import { UserRole, Permission } from './enums';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.PLATFORM_ADMIN]: Object.values(Permission),
  [UserRole.OWNER]: [
    Permission.BOOKING_READ,
    Permission.BOOKING_CREATE,
    Permission.BOOKING_UPDATE,
    Permission.BOOKING_CANCEL,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.SERVICE_MANAGE,
    Permission.STAFF_MANAGE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_VERIFY,
    Permission.REPORTS_READ,
    Permission.ORGANIZATION_MANAGE,
  ],
  [UserRole.MANAGER]: [
    Permission.BOOKING_READ,
    Permission.BOOKING_CREATE,
    Permission.BOOKING_UPDATE,
    Permission.BOOKING_CANCEL,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.SERVICE_MANAGE,
    Permission.STAFF_MANAGE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_VERIFY,
    Permission.REPORTS_READ,
  ],
  [UserRole.STAFF]: [
    Permission.BOOKING_READ,
    Permission.BOOKING_CREATE,
    Permission.BOOKING_UPDATE,
    Permission.CUSTOMER_READ,
  ],
  [UserRole.RECEPTIONIST]: [
    Permission.BOOKING_READ,
    Permission.BOOKING_CREATE,
    Permission.BOOKING_UPDATE,
    Permission.BOOKING_CANCEL,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_VERIFY,
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === UserRole.PLATFORM_ADMIN) return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
