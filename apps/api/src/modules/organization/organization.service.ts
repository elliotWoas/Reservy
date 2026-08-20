import { prisma } from '@reservy/database';
import { DomainError, DomainErrorCode } from '@reservy/domain';
import { UpdateOrganizationInput, CardAccountInput } from '@reservy/validation';

export class OrganizationService {
  async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        locations: true,
        cardAccounts: { where: { isActive: true } },
      },
    });

    if (!org) {
      throw new DomainError(DomainErrorCode.ORGANIZATION_NOT_FOUND, 'سازمان یافت نشد');
    }
    return org;
  }

  async updateOrganization(orgId: string, input: UpdateOrganizationInput) {
    if (input.slug) {
      const existing = await prisma.organization.findFirst({
        where: { slug: input.slug, NOT: { id: orgId } },
      });
      if (existing) {
        throw new DomainError(DomainErrorCode.INVALID_INPUT, 'شناسه آدرس (slug) قبلاً برای کسب‌وکار دیگری ثبت شده است');
      }
    }

    return await prisma.organization.update({
      where: { id: orgId },
      data: input,
    });
  }

  async getCardAccounts(orgId: string) {
    return await prisma.cardAccount.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setCardAccount(orgId: string, input: CardAccountInput) {
    // Disable previous active accounts if new one is set to active
    if (input.isActive) {
      await prisma.cardAccount.updateMany({
        where: { organizationId: orgId },
        data: { isActive: false },
      });
    }

    return await prisma.cardAccount.create({
      data: {
        organizationId: orgId,
        cardNumber: input.cardNumber,
        cardHolderName: input.cardHolderName,
        bankName: input.bankName,
        isActive: input.isActive,
      },
    });
  }

  async deleteCardAccount(orgId: string, cardId: string) {
    return await prisma.cardAccount.deleteMany({
      where: { id: cardId, organizationId: orgId },
    });
  }
}

export const organizationService = new OrganizationService();
