import { prisma } from '@reservy/database';
import { BookingStatus, DomainError, DomainErrorCode } from '@reservy/domain';
import { UpdateCustomerNotesInput } from '@reservy/validation';

export class CrmService {
  async getCustomers(
    orgId: string,
    filters: { search?: string; page?: number; limit?: number }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: {
          bookings: {
            where: { deletedAt: null },
            orderBy: { startAt: 'desc' },
            select: {
              id: true,
              startAt: true,
              status: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const now = new Date();

    const formattedCustomers = customers.map((c) => {
      const totalBookings = c.bookings.length;
      const completedBookings = c.bookings.filter((b) => b.status === BookingStatus.COMPLETED).length;
      const cancelledBookings = c.bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;
      const noShowBookings = c.bookings.filter((b) => b.status === BookingStatus.NO_SHOW).length;

      const totalSpent = c.bookings
        .filter((b) => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED)
        .reduce((sum, b) => sum + b.price, 0);

      const pastBookings = c.bookings.filter((b) => new Date(b.startAt) <= now);
      const futureBookings = c.bookings
        .filter((b) => new Date(b.startAt) > now && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REJECTED)
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

      const lastVisit = pastBookings.length > 0 ? pastBookings[0].startAt : null;
      const nextBooking = futureBookings.length > 0 ? futureBookings[0].startAt : null;

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        totalSpent,
        lastVisit,
        nextBooking,
        createdAt: c.createdAt,
      };
    });

    return {
      data: formattedCustomers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCustomerNotes(orgId: string, customerId: string, input: UpdateCustomerNotesInput) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId: orgId },
    });

    if (!customer) {
      throw new DomainError(DomainErrorCode.INVALID_INPUT, 'مشتری یافت نشد');
    }

    return await prisma.customer.update({
      where: { id: customerId },
      data: { notes: input.notes },
    });
  }
}

export const crmService = new CrmService();
