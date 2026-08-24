import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaymentStatus, DomainError, DomainErrorCode } from '@reservy/domain';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformOverview() {
    const [tenantsCount, orgsCount, usersCount, bookingsCount, verifiedPayments] =
      await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.organization.count(),
        this.prisma.user.count(),
        this.prisma.booking.count(),
        this.prisma.payment.findMany({
          where: { status: PaymentStatus.VERIFIED },
        }),
      ]);

    const totalProcessedVolume = verifiedPayments.reduce((acc, p) => acc + p.amount, 0);

    const recentOrganizations = await this.prisma.organization.findMany({
      include: {
        tenant: true,
        _count: {
          select: { bookings: true, staffMembers: true, services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
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

  async updateOrganizationStatus(orgId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'کسب‌وکار مورد نظر یافت نشد');
    }

    return await this.prisma.organization.update({
      where: { id: orgId },
      data: { status },
    });
  }
}
