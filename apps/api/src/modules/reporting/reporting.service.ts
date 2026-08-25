import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BookingStatus, PaymentStatus } from '@reservy/domain';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(orgId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      bookingsToday,
      pendingProofsCount,
      totalCustomers,
      verifiedPaymentsToday,
      verifiedPaymentsWeek,
      verifiedPaymentsMonth,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          organizationId: orgId,
          startAt: { gte: todayStart },
          deletedAt: null,
        },
      }),
      this.prisma.payment.count({
        where: {
          organizationId: orgId,
          status: PaymentStatus.PROOF_SUBMITTED,
        },
      }),
      this.prisma.customer.count({
        where: { organizationId: orgId },
      }),
      this.prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          verifiedAt: { gte: todayStart },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          verifiedAt: { gte: weekAgo },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: PaymentStatus.VERIFIED,
          verifiedAt: { gte: monthAgo },
        },
      }),
    ]);

    const revenueToday = verifiedPaymentsToday.reduce((acc, p) => acc + p.amount, 0);
    const revenueWeek = verifiedPaymentsWeek.reduce((acc, p) => acc + p.amount, 0);
    const revenueMonth = verifiedPaymentsMonth.reduce((acc, p) => acc + p.amount, 0);

    return {
      metrics: {
        bookingsToday,
        pendingProofsCount,
        totalCustomers,
        revenueToday,
        revenueWeek,
        revenueMonth,
      },
    };
  }

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
