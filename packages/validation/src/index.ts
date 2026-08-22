import { z } from 'zod';
import {
  BookingStatus,
  Currency,
  PaymentMethod,
  PaymentStatus,
  PaymentProofReviewStatus,
  UserRole,
} from '@reservy/domain';

// Phone normalization helper regex: matches 0912..., +98912..., 0098912..., 912...
export const IRANIAN_PHONE_REGEX = /^(?:(?:\+98|0098|0)?9\d{9})$/;

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

// ----------------------------------------------------
// Auth Schemas
// ----------------------------------------------------
export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'نام و نام خانوادگی باید حداقل ۲ حرف باشد'),
  email: z.string().email('فرمت آدرس ایمیل معتبر نیست'),
  phone: z.string().regex(IRANIAN_PHONE_REGEX, 'شماره موبایل وارد شده معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷)'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  organizationName: z.string().min(2, 'نام کسب‌وکار الزامی است'),
  organizationSlug: z
    .string()
    .min(2, 'شناسه یکتای آدرس باید حداقل ۲ کاراکتر باشد')
    .regex(/^[a-z0-9-]+$/, 'شناسه فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد'),
});

export const LoginSchema = z.object({
  email: z.string().email('فرمت آدرس ایمیل معتبر نیست'),
  password: z.string().min(1, 'وارد کردن رمز عبور الزامی است'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

// ----------------------------------------------------
// Organization & Settings Schemas
// ----------------------------------------------------
export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2, 'نام کسب‌وکار باید حداقل ۲ حرف باشد').optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional().nullable().or(z.literal('')),
  coverUrl: z.string().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  timezone: z.string().optional(),
  currency: z.nativeEnum(Currency).optional(),
  locale: z.string().optional(),
});

export const CardAccountSchema = z.object({
  cardNumber: z
    .string()
    .min(16, 'شماره کارت باید ۱۶ رقم باشد')
    .max(16, 'شماره کارت باید ۱۶ رقم باشد')
    .regex(/^\d{16}$/, 'شماره کارت باید فقط شامل عدد باشد'),
  cardHolderName: z.string().min(3, 'نام صاحب حساب الزامی است'),
  bankName: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type CardAccountInput = z.infer<typeof CardAccountSchema>;

// ----------------------------------------------------
// Catalog: Services & Categories
// ----------------------------------------------------
export const CreateServiceCategorySchema = z.object({
  name: z.string().min(2, 'نام دسته‌بندی الزامی است'),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const CreateServiceSchema = z.object({
  name: z.string().min(2, 'نام خدمت الزامی است'),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive('مدت زمان باید یک عدد مثبت باشد'),
  price: z.number().int().nonnegative('قیمت باید صفر یا مثبت باشد'),
  depositAmount: z.number().int().nonnegative().optional().default(0),
  currency: z.nativeEnum(Currency).default(Currency.IRT),
  bufferBeforeMinutes: z.number().int().nonnegative().default(0),
  bufferAfterMinutes: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;

// ----------------------------------------------------
// Staff Schemas
// ----------------------------------------------------
export const CreateStaffSchema = z.object({
  displayName: z.string().min(2, 'نام ارائه‌دهنده الزامی است'),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  isBookable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string()).optional().default([]),
});

export const UpdateStaffSchema = CreateStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;

// ----------------------------------------------------
// Schedule & Availability Schemas
// ----------------------------------------------------
export const ShiftIntervalSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'فرمت زمان نامعتبر است (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'فرمت زمان نامعتبر است (HH:MM)'),
});

export const DayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  shifts: z.array(ShiftIntervalSchema),
  breaks: z.array(ShiftIntervalSchema).optional().default([]),
  isDayOff: z.boolean().default(false),
});

export const SetStaffScheduleSchema = z.object({
  schedules: z.array(DayScheduleSchema),
});

export const CreateBlockedPeriodSchema = z.object({
  staffId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  reason: z.string().optional(),
});

export const AvailabilityQuerySchema = z.object({
  serviceId: z.string().min(1, 'شناسه خدمت الزامی است'),
  staffId: z.string().optional(),
  locationId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ باید YYYY-MM-DD باشد'),
});

export type DayScheduleInput = z.infer<typeof DayScheduleSchema>;
export type SetStaffScheduleInput = z.infer<typeof SetStaffScheduleSchema>;
export type CreateBlockedPeriodInput = z.infer<typeof CreateBlockedPeriodSchema>;
export type AvailabilityQueryParams = z.infer<typeof AvailabilityQuerySchema>;

// ----------------------------------------------------
// Booking Schemas
// ----------------------------------------------------
export const PublicCreateBookingSchema = z.object({
  serviceId: z.string().min(1, 'انتخاب خدمت الزامی است'),
  staffId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  startAt: z.string().min(1, 'زمان شروع باید یک تاریخ و زمان معتبر باشد'),
  customerName: z.string().min(2, 'نام و نام خانوادگی الزامی است'),
  customerPhone: z.string().regex(IRANIAN_PHONE_REGEX, 'شماره موبایل وارد شده معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷)'),
  customerEmail: z.string().email('فرمت ایمیل معتبر نیست').optional().nullable().or(z.literal('')),
  notes: z.string().max(500).optional().nullable().or(z.literal('')),
});

export const DashboardCreateBookingSchema = PublicCreateBookingSchema.extend({
  status: z.nativeEnum(BookingStatus).default(BookingStatus.CONFIRMED),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  cancellationReason: z.string().optional(),
});

export type PublicCreateBookingInput = z.infer<typeof PublicCreateBookingSchema>;
export type DashboardCreateBookingInput = z.infer<typeof DashboardCreateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

// ----------------------------------------------------
// Payment & Receipt Proof Schemas
// ----------------------------------------------------
export const SubmitPaymentProofSchema = z.object({
  bookingId: z.string().min(1, 'شناسه رزرو الزامی است'),
  fileUrl: z.string().min(1, 'آدرس فایل رسید الزامی است'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], {
    errorMap: () => ({ message: 'فرمت فایل مجاز نیست (فقط JPG، PNG، WEBP یا PDF)' }),
  }),
  fileSize: z.number().int().max(10 * 1024 * 1024, 'حداکثر حجم مجاز ۱۰ مگابایت است'),
  amount: z.number().int().positive('مبلغ باید یک عدد مثبت باشد'),
  referenceNumber: z.string().optional().nullable(),
});

export const VerifyPaymentProofSchema = z.object({
  reviewStatus: z.enum([PaymentProofReviewStatus.APPROVED, PaymentProofReviewStatus.REJECTED]),
  rejectionReason: z.string().optional().nullable(),
});

export type SubmitPaymentProofInput = z.infer<typeof SubmitPaymentProofSchema>;
export type VerifyPaymentProofInput = z.infer<typeof VerifyPaymentProofSchema>;

// ----------------------------------------------------
// CRM Customer Schemas
// ----------------------------------------------------
export const UpdateCustomerNotesSchema = z.object({
  notes: z.string(),
});

export type UpdateCustomerNotesInput = z.infer<typeof UpdateCustomerNotesSchema>;
