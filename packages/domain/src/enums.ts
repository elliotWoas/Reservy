export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  RECEPTIONIST = 'RECEPTIONIST',
}

export enum Permission {
  // Booking
  BOOKING_READ = 'booking:read',
  BOOKING_CREATE = 'booking:create',
  BOOKING_UPDATE = 'booking:update',
  BOOKING_CANCEL = 'booking:cancel',

  // Customer / CRM
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_UPDATE = 'customer:update',

  // Catalog
  SERVICE_MANAGE = 'service:manage',
  STAFF_MANAGE = 'staff:manage',

  // Payment
  PAYMENT_READ = 'payment:read',
  PAYMENT_VERIFY = 'payment:verify',

  // Reports
  REPORTS_READ = 'reports:read',

  // Organization Settings
  ORGANIZATION_MANAGE = 'organization:manage',

  // Super Admin Platform
  ADMIN_ALL = 'admin:all',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED',
  PAYMENT_REVIEW = 'PAYMENT_REVIEW',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  CARD_TO_CARD = 'CARD_TO_CARD',
  ONLINE_GATEWAY = 'ONLINE_GATEWAY',
  WALLET = 'WALLET',
  CASH = 'CASH',
  POS = 'POS',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROOF_SUBMITTED = 'PROOF_SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProofReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Currency {
  IRR = 'IRR',
  IRT = 'IRT', // Toman
  USD = 'USD',
  EUR = 'EUR',
}

export enum DayOfWeek {
  SATURDAY = 0,
  SUNDAY = 1,
  MONDAY = 2,
  TUESDAY = 3,
  WEDNESDAY = 4,
  THURSDAY = 5,
  FRIDAY = 6,
}
