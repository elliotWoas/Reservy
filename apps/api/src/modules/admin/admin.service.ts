import { prisma } from '@reservy/database';
import { OrganizationStatus } from '@reservy/domain';

export class AdminService {
  async getPlatformOverview() {
    const [tenantsCount, orgsCount, usersCount, bookingsCount, verifiedPayments] = await Promise.all([
      prisma.tenant.count(),
      prisma.organization.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.payment.findMany({
        where: { status: 'VERIFIED' },
        select: { amount: true },
      }),
    ]);

    const totalProcessedVolume = verifiedPayments.reduce((acc, p) => acc + p.amount, 0);

    const recentOrganizations = await prisma.organization.findMany({
      include: {
        tenant: true,
        _count: { select: { bookings: true, staffMembers: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      metrics: {
        tenantsCount,
        orgsCount,
        usersCount,
        bookingsCount,
        totalProcessedVolume,
      },
      recentOrganizations,
    };
  }

  async setOrganizationStatus(orgId: string, status: OrganizationStatus) {
    return await prisma.organization.update({
      where: { id: orgId },
      data: { status },
    });
  }
}

export const adminService = new AdminService();
