import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '@reservy/domain';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves dashboard summary metrics, pending receipts, today's appointments,
   * tomorrow's appointments, and recent bookings prioritized by day.
   *
   * @param orgId Organization (tenant) ID
   */
  async getDashboardSummary(orgId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      bookingsToday,
      confirmedToday,
      bookingsTomorrow,
      pendingProofsCount,
      totalCustomers,
      totalBookingsAllTime,
      verifiedPaymentsToday,
      verifiedPaymentsWeek,
      verifiedPaymentsMonth,
      recentPendingPayments,
      upcomingToday,
      upcomingTomorrow,
      recentBookings,
    ] = await Promise.all([
      // 1. Total bookings today
      this.prisma.booking.count({
        where: {
          organizationId: orgId,
          startAt: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
        },
      }),

      // 2. Confirmed bookings today
      this.prisma.booking.count({
        where: {
          organizationId: orgId,
          startAt: { gte: todayStart, lte: todayEnd },
          status: BookingStatus.CONFIRMED,
          deletedAt: null,
        },
      }),

      // 3. Bookings tomorrow
      this.prisma.booking.count({
        where: {
          organizationId: orgId,
          startAt: { gte: tomorrowStart, lte: tomorrowEnd },
          deletedAt: null,
        },
      }),

      // 4. Pending receipt proofs count
      this.prisma.payment.count({
        where: {
          organizationId: orgId,
          status: PaymentStatus.PROOF_SUBMITTED,
        },
      }),

      // 5. Total registered CRM customers
      this.prisma.customer.count({
        where: { organizationId: orgId },
      }),

      // 6. Total bookings all time
      this.prisma.booking.count({
        where: { organizationId: orgId, deletedAt: null },
      }),

      // 7. Payments verified today
      this.prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          verifiedAt: { gte: todayStart },
        },
      }),

      // 8. Payments verified this week
      this.prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          verifiedAt: { gte: weekAgo },
        },
      }),

      // 9. Payments verified this month
      this.prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          verifiedAt: { gte: monthAgo },
        },
      }),

      // 10. Recent payments awaiting verification
      this.prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.PROOF_SUBMITTED,
        },
        include: {
          booking: {
            include: {
              customer: true,
              service: true,
              staff: true,
            },
          },
          proofs: {
            orderBy: { uploadedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // 11. Today's appointments (Priority 1)
      this.prisma.booking.findMany({
        where: {
          organizationId: orgId,
          startAt: { gte: todayStart, lte: todayEnd },
          deletedAt: null,
        },
        include: {
          customer: true,
          service: true,
          staff: true,
          payments: {
            include: { proofs: true },
          },
        },
        orderBy: { startAt: 'asc' },
      }),

      // 12. Tomorrow's appointments (Priority 2)
      this.prisma.booking.findMany({
        where: {
          organizationId: orgId,
          startAt: { gte: tomorrowStart, lte: tomorrowEnd },
          deletedAt: null,
        },
        include: {
          customer: true,
          service: true,
          staff: true,
          payments: {
            include: { proofs: true },
          },
        },
        orderBy: { startAt: 'asc' },
      }),

      // 13. Latest bookings overall
      this.prisma.booking.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
        },
        include: {
          customer: true,
          service: true,
          staff: true,
          payments: {
            include: { proofs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const revenueToday = verifiedPaymentsToday.reduce((acc, p) => acc + p.amount, 0);
    const revenueWeek = verifiedPaymentsWeek.reduce((acc, p) => acc + p.amount, 0);
    const revenueMonth = verifiedPaymentsMonth.reduce((acc, p) => acc + p.amount, 0);

    return {
      metrics: {
        bookingsToday,
        confirmedToday,
        bookingsTomorrow,
        pendingProofsCount,
        totalCustomers,
        totalBookingsAllTime,
        revenueToday,
        revenueWeek,
        revenueMonth,
      },
      recentPendingPayments,
      upcomingToday,
      upcomingTomorrow,
      recentBookings,
    };
  }

  /**
   * Retrieves top services and staff performance rankings.
   *
   * @param orgId Organization ID
   */
  async getPerformanceReports(orgId: string) {
    const [services, staff] = await Promise.all([
      this.prisma.service.findMany({
        where: { organizationId: orgId, deletedAt: null },
        include: {
          bookings: {
            where: { status: BookingStatus.COMPLETED, deletedAt: null },
          },
        },
      }),
      this.prisma.staffMember.findMany({
        where: { organizationId: orgId, deletedAt: null },
        include: {
          bookings: {
            where: { status: BookingStatus.COMPLETED, deletedAt: null },
          },
        },
      }),
    ]);

    const topServices = services
      .map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        totalCompletedBookings: s.bookings.length,
        estimatedRevenue: s.bookings.reduce((acc, b) => acc + b.priceSnapshot, 0),
      }))
      .sort((a, b) => b.totalCompletedBookings - a.totalCompletedBookings);

    const topStaff = staff
      .map((st) => ({
        id: st.id,
        displayName: st.displayName,
        totalCompletedBookings: st.bookings.length,
      }))
      .sort((a, b) => b.totalCompletedBookings - a.totalCompletedBookings);

    return {
      topServices,
      topStaff,
    };
  }
}
