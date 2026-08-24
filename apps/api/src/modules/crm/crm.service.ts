import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BookingStatus, DomainError, DomainErrorCode } from '@reservy/domain';
import { UpdateCustomerNotesInput } from '@reservy/validation';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers(
    orgId: string,
    filters: { search?: string; page?: number; limit?: number }
  ) {
    const { search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        include: {
          bookings: {
            where: { deletedAt: null },
            orderBy: { startAt: 'desc' },
            include: { service: true, staff: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = customers.map((c) => {
      const completed = c.bookings.filter((b) => b.status === BookingStatus.COMPLETED);
      const totalSpent = completed.reduce((acc, b) => acc + b.priceSnapshot, 0);

      const lastVisit = completed[0]?.startAt || null;
      const nextBooking = c.bookings.find(
        (b) =>
          (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PAYMENT_SUBMITTED) &&
          new Date(b.startAt) > new Date()
      );

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        totalBookings: c.bookings.length,
        completedBookings: completed.length,
        cancelledBookings: c.bookings.filter((b) => b.status === BookingStatus.CANCELLED).length,
        totalSpent,
        lastVisit,
        nextBooking: nextBooking?.startAt || null,
        createdAt: c.createdAt,
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCustomerNotes(orgId: string, customerId: string, input: UpdateCustomerNotesInput) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: orgId },
    });

    if (!customer) {
      throw new DomainError(DomainErrorCode.CUSTOMER_NOT_FOUND, 'مشتری مورد نظر یافت نشد');
    }

    return await this.prisma.customer.update({
      where: { id: customerId },
      data: { notes: input.notes },
    });
  }
}
