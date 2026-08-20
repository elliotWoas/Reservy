import crypto from 'crypto';
import { prisma } from '@reservy/database';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  DomainError,
  DomainErrorCode,
  canTransitionBooking,
  isDateOverlapping,
} from '@reservy/domain';
import {
  PublicCreateBookingInput,
  DashboardCreateBookingInput,
  UpdateBookingStatusInput,
  normalizePhone,
} from '@reservy/validation';
import { notificationService } from '../../core/notifications/notification.service';
import { auditService } from '../../core/audit/audit.service';

function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${code}`;
}

export class BookingService {
  /**
   * Creates a new booking inside a transaction with strict concurrency & double-booking prevention.
   */
  async createBooking(
    orgId: string,
    input: PublicCreateBookingInput | DashboardCreateBookingInput,
    options?: { actorUserId?: string; initialStatus?: BookingStatus }
  ) {
    const cleanPhone = normalizePhone(input.customerPhone);
    const startAt = new Date(input.startAt);

    if (startAt.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new DomainError(DomainErrorCode.PAST_DATE_NOT_ALLOWED, 'امکان رزرو در تاریخ و زمان گذشته وجود ندارد');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch Service
      const service = await tx.service.findFirst({
        where: { id: input.serviceId, organizationId: orgId, isActive: true, deletedAt: null },
        include: {
          staffServices: {
            include: { staff: true },
          },
        },
      });

      if (!service) {
        throw new DomainError(DomainErrorCode.SERVICE_NOT_FOUND, 'خدمت مورد نظر یافت نشد یا غیرفعال است');
      }

      // Calculate end time
      const durationMs = service.durationMinutes * 60 * 1000;
      const endAt = new Date(startAt.getTime() + durationMs);

      // 2. Determine Staff Member
      let assignedStaffId = input.staffId;
      if (!assignedStaffId) {
        // Auto-assign first available staff member
        const availableStaff = service.staffServices.find(
          (ss) => ss.staff && ss.staff.isActive && ss.staff.isBookable
        );
        if (!availableStaff) {
          throw new DomainError(DomainErrorCode.STAFF_NOT_FOUND, 'هیچ ارائه‌دهنده‌ای برای این خدمت در دسترس نیست');
        }
        assignedStaffId = availableStaff.staffId;
      }

      const staff = await tx.staffMember.findFirst({
        where: { id: assignedStaffId, organizationId: orgId, isActive: true, isBookable: true, deletedAt: null },
      });

      if (!staff) {
        throw new DomainError(DomainErrorCode.STAFF_NOT_FOUND, 'ارائه‌دهنده انتخاب شده یافت نشد یا غیرفعال است');
      }

      // 3. Prevent Double-Booking: Concurrency conflict detection
      // Check buffer times
      const bufferBeforeMs = service.bufferBeforeMinutes * 60 * 1000;
      const bufferAfterMs = service.bufferAfterMinutes * 60 * 1000;
      const searchStart = new Date(startAt.getTime() - bufferBeforeMs);
      const searchEnd = new Date(endAt.getTime() + bufferAfterMs);

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          organizationId: orgId,
          staffId: assignedStaffId,
          startAt: { lt: searchEnd },
          endAt: { gt: searchStart },
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED] },
          deletedAt: null,
        },
      });

      if (conflictingBooking) {
        throw new DomainError(
          DomainErrorCode.BOOKING_SLOT_UNAVAILABLE,
          'متأسفانه این زمان به تازگی رزرو شده است. لطفاً زمان دیگری را انتخاب نمایید.'
        );
      }

      // Check blocked periods
      const conflictingBlock = await tx.blockedPeriod.findFirst({
        where: {
          organizationId: orgId,
          OR: [{ staffId: assignedStaffId }, { staffId: null }],
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });

      if (conflictingBlock) {
        throw new DomainError(
          DomainErrorCode.BOOKING_SLOT_UNAVAILABLE,
          'این زمان توسط ارائه‌دهنده مسدود شده است'
        );
      }

      // 4. Find or Create Customer
      let customer = await tx.customer.findUnique({
        where: {
          organizationId_phone: {
            organizationId: orgId,
            phone: cleanPhone,
          },
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            organizationId: orgId,
            fullName: input.customerName,
            phone: cleanPhone,
            email: input.customerEmail || null,
          },
        });
      } else if (input.customerName && input.customerName !== customer.fullName) {
        // Update name if changed
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { fullName: input.customerName },
        });
      }

      // 5. Generate Code & Token
      const bookingCode = generateBookingCode();
      const accessToken = `tok_${crypto.randomBytes(24).toString('hex')}`;
      const initialStatus =
        options?.initialStatus ||
        ('status' in input && input.status ? input.status : BookingStatus.PENDING_PAYMENT);

      // 6. Create Booking & Items
      const booking = await tx.booking.create({
        data: {
          organizationId: orgId,
          locationId: input.locationId || null,
          customerId: customer.id,
          staffId: assignedStaffId,
          serviceId: service.id,
          code: bookingCode,
          accessToken,
          startAt,
          endAt,
          status: initialStatus,
          price: service.price,
          depositAmount: service.depositAmount,
          currency: service.currency,
          notes: input.notes,
          serviceNameSnapshot: service.name,
          staffNameSnapshot: staff.displayName,
          priceSnapshot: service.price,
          durationSnapshot: service.durationMinutes,
          items: {
            create: {
              serviceId: service.id,
              serviceNameSnapshot: service.name,
              priceSnapshot: service.price,
              durationSnapshot: service.durationMinutes,
            },
          },
        },
      });

      // 7. Create Payment record for card-to-card
      const payment = await tx.payment.create({
        data: {
          organizationId: orgId,
          bookingId: booking.id,
          method: PaymentMethod.CARD_TO_CARD,
          amount: service.price,
          currency: service.currency,
          status: initialStatus === BookingStatus.CONFIRMED ? PaymentStatus.VERIFIED : PaymentStatus.PENDING,
        },
      });

      // Fetch active card account to present to customer
      const cardAccount = await tx.cardAccount.findFirst({
        where: { organizationId: orgId, isActive: true },
      });

      return {
        booking: {
          id: booking.id,
          code: booking.code,
          accessToken: booking.accessToken,
          startAt: booking.startAt,
          endAt: booking.endAt,
          status: booking.status,
          price: booking.price,
          currency: booking.currency,
          serviceName: booking.serviceNameSnapshot,
          staffName: booking.staffNameSnapshot,
        },
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
        },
        cardAccount: cardAccount
          ? {
              cardNumber: cardAccount.cardNumber,
              cardHolderName: cardAccount.cardHolderName,
              bankName: cardAccount.bankName,
            }
          : null,
      };
    });
  }

  async getBookingByToken(accessToken: string) {
    const booking = await prisma.booking.findUnique({
      where: { accessToken },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            logoUrl: true,
            cardAccounts: { where: { isActive: true }, take: 1 },
          },
        },
        customer: true,
        staff: true,
        service: true,
        payments: {
          include: { proofs: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new DomainError(DomainErrorCode.BOOKING_NOT_FOUND, 'رزرو مورد نظر یافت نشد');
    }
    return booking;
  }

  async getBookings(
    orgId: string,
    filters: {
      status?: BookingStatus;
      staffId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: orgId,
      deletedAt: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.staffId) where.staffId = filters.staffId;
    if (filters.startDate || filters.endDate) {
      where.startAt = {};
      if (filters.startDate) where.startAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.startAt.lte = new Date(filters.endDate);
    }
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { customer: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: filters.search } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          customer: true,
          staff: true,
          service: true,
          payments: {
            include: { proofs: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { startAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBookingStatus(
    orgId: string,
    bookingId: string,
    input: UpdateBookingStatusInput,
    actorUserId?: string
  ) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, organizationId: orgId, deletedAt: null },
    });

    if (!booking) {
      throw new DomainError(DomainErrorCode.BOOKING_NOT_FOUND, 'رزرو یافت نشد');
    }

    const transitionCheck = canTransitionBooking(booking.status as BookingStatus, input.status);
    if (!transitionCheck.valid) {
      throw new DomainError(
        DomainErrorCode.INVALID_BOOKING_TRANSITION,
        transitionCheck.reason || 'امکان تغییر وضعیت رزرو وجود ندارد'
      );
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: input.status,
        cancellationReason: input.cancellationReason || null,
        cancelledAt: input.status === BookingStatus.CANCELLED ? new Date() : undefined,
        completedAt: input.status === BookingStatus.COMPLETED ? new Date() : undefined,
      },
    });

    // Audit log
    await auditService.log({
      organizationId: orgId,
      actorUserId,
      action: 'BOOKING_STATUS_CHANGED',
      entityType: 'Booking',
      entityId: bookingId,
      metadata: { from: booking.status, to: input.status, reason: input.cancellationReason },
    });

    return updated;
  }
}

export const bookingService = new BookingService();
