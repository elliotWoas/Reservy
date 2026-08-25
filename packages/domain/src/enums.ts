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
  SERVICE_CREATE = 'service:manage',
  SERVICE_UPDATE = 'service:manage',
  SERVICE_DELETE = 'service:manage',
  STAFF_MANAGE = 'staff:manage',
  STAFF_CREATE = 'staff:manage',
  STAFF_UPDATE = 'staff:manage',

  // Payment
  PAYMENT_READ = 'payment:read',
  PAYMENT_VERIFY = 'payment:verify',

  // Reports
  REPORTS_READ = 'reports:read',
  REPORTING_READ = 'reports:read',

  // Organization Settings
  ORGANIZATION_MANAGE = 'organization:manage',
  ORGANIZATION_UPDATE = 'organization:manage',

  // Super Admin Platform
  ADMIN_ALL = 'admin:all',
  PLATFORM_MANAGE = 'admin:all',
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
  GATEWAY_ZARINPAL = 'GATEWAY_ZARINPAL',
  GATEWAY_IDPAY = 'GATEWAY_IDPAY',
  POS = 'POS',
  CASH = 'CASH',
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
  IRT = 'IRT', // Iranian Toman (default)
  IRR = 'IRR', // Iranian Rial
  USD = 'USD',
  EUR = 'EUR',
}

export enum NotificationChannel {
  SMS_KAVENEGAR = 'SMS_KAVENEGAR',
  SMS_FARAZ = 'SMS_FARAZ',
  EMAIL = 'EMAIL',
  TELEGRAM = 'TELEGRAM',
  WEB_PUSH = 'WEB_PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}
