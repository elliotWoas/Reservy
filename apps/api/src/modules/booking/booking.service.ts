import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  BookingStatus,
  DomainError,
  DomainErrorCode,
  canTransitionBooking,
} from '@reservy/domain';
import {
  PublicCreateBookingInput,
  DashboardCreateBookingInput,
  UpdateBookingStatusInput,
  normalizePhone,
} from '@reservy/validation';

function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${code}`;
}

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

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

    return await this.prisma.$transaction(async (tx) => {
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

      const durationMs = service.durationMinutes * 60 * 1000;
      const endAt = new Date(startAt.getTime() + durationMs);

      let assignedStaffId = input.staffId;
      if (!assignedStaffId) {
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
          'این زمان رزرو قبلاً پر شده است. لطفاً زمان دیگری را انتخاب نمایید.'
        );
      }

      let customer = await tx.customer.findFirst({
        where: { organizationId: orgId, phone: cleanPhone },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            organizationId: orgId,
            fullName: input.customerName,
            phone: cleanPhone,
            email: input.customerEmail || undefined,
          },
        });
      } else {
        if (input.customerName && customer.fullName !== input.customerName) {
          await tx.customer.update({
            where: { id: customer.id },
            data: { fullName: input.customerName },
          });
        }
      }

      const code = generateBookingCode();
      const accessToken = crypto.randomBytes(32).toString('hex');
      const initialStatus = options?.initialStatus || BookingStatus.PENDING_PAYMENT;

      const booking = await tx.booking.create({
        data: {
          organizationId: orgId,
          locationId: input.locationId,
          customerId: customer.id,
          staffId: assignedStaffId,
          serviceId: service.id,
          code,
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
        include: {
          customer: true,
          staff: true,
          service: true,
        },
      });

      const cardAccount = await tx.cardAccount.findFirst({
        where: { organizationId: orgId, isActive: true },
      });

      return {
        booking,
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
    const { status, staffId, startDate, endDate, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: orgId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (staffId) where.staffId = staffId;
    if (startDate || endDate) {
      where.startAt = {};
      if (startDate) where.startAt.gte = new Date(startDate);
      if (endDate) where.startAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: {
          customer: true,
          staff: true,
          service: true,
          payments: {
            include: { proofs: true },
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

  async getBookingById(orgId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, organizationId: orgId, deletedAt: null },
      include: {
        customer: true,
        staff: true,
        service: true,
        payments: {
          include: { proofs: true },
        },
      },
    });

    if (!booking) {
      throw new DomainError(DomainErrorCode.BOOKING_NOT_FOUND, 'نوبت مورد نظر یافت نشد');
    }

    return booking;
  }

  async getBookingByToken(accessToken: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { accessToken },
      include: {
        organization: {
          select: { name: true, phone: true, logoUrl: true, cardAccounts: { where: { isActive: true } } },
        },
        customer: true,
        staff: true,
        service: true,
        payments: {
          include: { proofs: true },
        },
      },
    });

    if (!booking) {
      throw new DomainError(DomainErrorCode.BOOKING_NOT_FOUND, 'نوبت یافت نشد یا لینک منقضی شده است');
    }

    return booking;
  }

  async updateBookingStatus(
    orgId: string,
    bookingId: string,
    input: UpdateBookingStatusInput,
    actorUserId?: string
  ) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, organizationId: orgId, deletedAt: null },
    });

    if (!booking) {
      throw new DomainError(DomainErrorCode.BOOKING_NOT_FOUND, 'نوبت مورد نظر یافت نشد');
    }

    const validation = canTransitionBooking(booking.status as BookingStatus, input.status);
    if (!validation.valid) {
      throw new DomainError(DomainErrorCode.INVALID_STATUS_TRANSITION, validation.reason!);
    }

    const updateData: any = {
      status: input.status,
    };

    if (input.status === BookingStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      if (input.cancellationReason) updateData.cancellationReason = input.cancellationReason;
    } else if (input.status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: true,
        staff: true,
        service: true,
      },
    });
  }
}
