import { prisma } from '@reservy/database';
import { DomainError, DomainErrorCode } from '@reservy/domain';
import {
  CreateServiceInput,
  UpdateServiceInput,
  CreateStaffInput,
  UpdateStaffInput,
  CreateServiceCategorySchema,
} from '@reservy/validation';

export class CatalogService {
  // ----------------------------------------------------
  // Categories
  // ----------------------------------------------------
  async getCategories(orgId: string) {
    return await prisma.serviceCategory.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { services: { where: { deletedAt: null } } } },
      },
    });
  }

  async createCategory(orgId: string, name: string, description?: string, sortOrder?: number) {
    return await prisma.serviceCategory.create({
      data: {
        organizationId: orgId,
        name,
        description,
        sortOrder: sortOrder || 0,
      },
    });
  }

  async deleteCategory(orgId: string, categoryId: string) {
    return await prisma.serviceCategory.deleteMany({
      where: { id: categoryId, organizationId: orgId },
    });
  }

  // ----------------------------------------------------
  // Services
  // ----------------------------------------------------
  async getServices(orgId: string, options?: { includeInactive?: boolean }) {
    return await prisma.service.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(options?.includeInactive ? {} : { isActive: true }),
      },
      include: {
        category: true,
        staffServices: {
          include: { staff: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createService(orgId: string, input: CreateServiceInput) {
    return await prisma.service.create({
      data: {
        organizationId: orgId,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        durationMinutes: input.durationMinutes,
        price: input.price,
        depositAmount: input.depositAmount || 0,
        currency: input.currency,
        bufferBeforeMinutes: input.bufferBeforeMinutes || 0,
        bufferAfterMinutes: input.bufferAfterMinutes || 0,
        isActive: input.isActive ?? true,
        isPublic: input.isPublic ?? true,
      },
    });
  }

  async updateService(orgId: string, serviceId: string, input: UpdateServiceInput) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, organizationId: orgId, deletedAt: null },
    });

    if (!service) {
      throw new DomainError(DomainErrorCode.SERVICE_NOT_FOUND, 'خدمت مورد نظر یافت نشد');
    }

    return await prisma.service.update({
      where: { id: serviceId },
      data: input,
    });
  }

  async deleteService(orgId: string, serviceId: string) {
    return await prisma.service.updateMany({
      where: { id: serviceId, organizationId: orgId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ----------------------------------------------------
  // Staff Members
  // ----------------------------------------------------
  async getStaffMembers(orgId: string, options?: { includeInactive?: boolean }) {
    return await prisma.staffMember.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(options?.includeInactive ? {} : { isActive: true }),
      },
      include: {
        staffServices: {
          include: { service: true },
        },
        schedules: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createStaff(orgId: string, input: CreateStaffInput) {
    return await prisma.$transaction(async (tx) => {
      const staff = await tx.staffMember.create({
        data: {
          organizationId: orgId,
          displayName: input.displayName,
          bio: input.bio,
          avatarUrl: input.avatarUrl,
          phone: input.phone,
          isBookable: input.isBookable ?? true,
          isActive: input.isActive ?? true,
        },
      });

      if (input.serviceIds && input.serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: input.serviceIds.map((serviceId) => ({
            staffId: staff.id,
            serviceId,
          })),
        });
      }

      // Initialize default working schedule (Sat-Thu 10:00-20:00, Fri off)
      for (let day = 0; day <= 6; day++) {
        const isFriday = day === 6;
        await tx.staffSchedule.create({
          data: {
            organizationId: orgId,
            staffId: staff.id,
            dayOfWeek: day,
            isDayOff: isFriday,
            shiftsJson: isFriday ? '[]' : JSON.stringify([{ startTime: '10:00', endTime: '20:00' }]),
            breaksJson: isFriday ? '[]' : JSON.stringify([{ startTime: '14:00', endTime: '15:00' }]),
          },
        });
      }

      return staff;
    });
  }

  async updateStaff(orgId: string, staffId: string, input: UpdateStaffInput) {
    const staff = await prisma.staffMember.findFirst({
      where: { id: staffId, organizationId: orgId, deletedAt: null },
    });

    if (!staff) {
      throw new DomainError(DomainErrorCode.STAFF_NOT_FOUND, 'عضو تیم یافت نشد');
    }

    return await prisma.$transaction(async (tx) => {
      if (input.serviceIds) {
        await tx.staffService.deleteMany({ where: { staffId } });
        if (input.serviceIds.length > 0) {
          await tx.staffService.createMany({
            data: input.serviceIds.map((serviceId) => ({
              staffId,
              serviceId,
            })),
          });
        }
      }

      const { serviceIds, ...updateData } = input;
      return await tx.staffMember.update({
        where: { id: staffId },
        data: updateData,
        include: { staffServices: { include: { service: true } } },
      });
    });
  }

  async deleteStaff(orgId: string, staffId: string) {
    return await prisma.staffMember.updateMany({
      where: { id: staffId, organizationId: orgId },
      data: { deletedAt: new Date(), isActive: false, isBookable: false },
    });
  }
}

export const catalogService = new CatalogService();
