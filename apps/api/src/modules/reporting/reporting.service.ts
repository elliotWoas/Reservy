import { prisma } from '@reservy/database';
import { BookingStatus, PaymentStatus } from '@reservy/domain';

export class ReportingService {
  async getDashboardSummary(orgId: string) {
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // 1. Today's Bookings Count
    const todayBookingsCount = await prisma.booking.count({
      where: {
        organizationId: orgId,
        startAt: { gte: startOfToday, lte: endOfToday },
        deletedAt: null,
      },
    });

    // 2. Pending Payments Count (awaiting review)
    const pendingPaymentsCount = await prisma.payment.count({
      where: {
        organizationId: orgId,
        status: PaymentStatus.PROOF_SUBMITTED,
      },
    });

    // 3. Total Customers
    const totalCustomersCount = await prisma.customer.count({
      where: { organizationId: orgId },
    });

    // 4. Revenue Today, This Week, This Month (from verified payments or completed bookings)
    const [todayPayments, weekPayments, monthPayments] = await Promise.all([
      prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          paidAt: { gte: startOfToday, lte: endOfToday },
        },
        select: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          paidAt: { gte: startOfWeek },
        },
        select: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          paidAt: { gte: startOfMonth },
        },
        select: { amount: true },
      }),
    ]);

    const revenueToday = todayPayments.reduce((acc, p) => acc + p.amount, 0);
    const revenueWeek = weekPayments.reduce((acc, p) => acc + p.amount, 0);
    const revenueMonth = monthPayments.reduce((acc, p) => acc + p.amount, 0);

    // 5. Booking Status Counts
    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      where: { organizationId: orgId, deletedAt: null },
      _count: { status: true },
    });

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // 6. Upcoming Today Bookings
    const upcomingToday = await prisma.booking.findMany({
      where: {
        organizationId: orgId,
        startAt: { gte: now, lte: endOfToday },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PAYMENT_SUBMITTED, BookingStatus.PENDING_PAYMENT] },
        deletedAt: null,
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
      orderBy: { startAt: 'asc' },
      take: 5,
    });

    // 7. Recent Pending Payments
    const recentPendingPayments = await prisma.payment.findMany({
      where: {
        organizationId: orgId,
        status: PaymentStatus.PROOF_SUBMITTED,
      },
      include: {
        booking: {
          include: {
            customer: true,
            service: true,
          },
        },
        proofs: { orderBy: { uploadedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      metrics: {
        todayBookingsCount,
        pendingPaymentsCount,
        totalCustomersCount,
        revenueToday,
        revenueWeek,
        revenueMonth,
      },
      statusBreakdown: statusMap,
      upcomingToday,
      recentPendingPayments,
    };
  }

  async getPerformanceReport(orgId: string) {
    const services = await prisma.service.findMany({
      where: { organizationId: orgId, deletedAt: null },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED] } },
            },
          },
        },
      },
    });

    const staffMembers = await prisma.staffMember.findMany({
      where: { organizationId: orgId, deletedAt: null },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED] } },
            },
          },
        },
      },
    });

    return {
      topServices: services
        .map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          totalCompletedBookings: s._count.bookings,
          estimatedRevenue: s._count.bookings * s.price,
        }))
        .sort((a, b) => b.totalCompletedBookings - a.totalCompletedBookings),

      topStaff: staffMembers
        .map((st) => ({
          id: st.id,
          displayName: st.displayName,
          totalCompletedBookings: st._count.bookings,
        }))
        .sort((a, b) => b.totalCompletedBookings - a.totalCompletedBookings),
    };
  }
}

export const reportingService = new ReportingService();
