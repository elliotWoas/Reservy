import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UpdateOrganizationInput, CardAccountInput } from '@reservy/validation';
import { DomainError, DomainErrorCode } from '@reservy/domain';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        locations: true,
        cardAccounts: {
          where: { isActive: true },
        },
      },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'کسب‌وکار یافت نشد');
    }

    return org;
  }

  async updateOrganization(orgId: string, input: UpdateOrganizationInput) {
    if (input.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: { slug: input.slug, NOT: { id: orgId } },
      });
      if (existing) {
        throw new DomainError(DomainErrorCode.SLUG_ALREADY_EXISTS, 'این شناسه آدرس یکتا قبلاً ثبت شده است');
      }
    }

    return await this.prisma.organization.update({
      where: { id: orgId },
      data: input,
    });
  }

  async setCardAccount(orgId: string, input: CardAccountInput) {
    await this.prisma.cardAccount.updateMany({
      where: { organizationId: orgId },
      data: { isActive: false },
    });

    return await this.prisma.cardAccount.create({
      data: {
        organizationId: orgId,
        cardNumber: input.cardNumber,
        cardHolderName: input.cardHolderName,
        bankName: input.bankName,
        isActive: true,
      },
    });
  }
}
