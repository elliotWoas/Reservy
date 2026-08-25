import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateServiceInput,
  UpdateServiceInput,
  CreateStaffInput,
  UpdateStaffInput,
  CreateServiceCategoryInput,
} from '@reservy/validation';
import { DomainError, DomainErrorCode } from '@reservy/domain';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // Services
  async getServices(orgId: string) {
    return await this.prisma.service.findMany({
      where: { organizationId: orgId, deletedAt: null },
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
    return await this.prisma.service.create({
      data: {
        organizationId: orgId,
        ...input,
      },
    });
  }

  async updateService(orgId: string, id: string, input: UpdateServiceInput) {
    const service = await this.prisma.service.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!service) {
      throw new DomainError(DomainErrorCode.SERVICE_NOT_FOUND, 'خدمت مورد نظر یافت نشد');
    }
    return await this.prisma.service.update({
      where: { id },
      data: input,
    });
  }

  async deleteService(orgId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!service) {
      throw new DomainError(DomainErrorCode.SERVICE_NOT_FOUND, 'خدمت مورد نظر یافت نشد');
    }
    return await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Categories
  async getCategories(orgId: string) {
    return await this.prisma.serviceCategory.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(orgId: string, input: CreateServiceCategoryInput) {
    return await this.prisma.serviceCategory.create({
      data: {
        organizationId: orgId,
        ...input,
      },
    });
  }

  // Staff
  async getStaff(orgId: string) {
    return await this.prisma.staffMember.findMany({
      where: { organizationId: orgId, deletedAt: null },
      include: {
        staffServices: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaff(orgId: string, input: CreateStaffInput) {
    const { serviceIds = [], ...staffData } = input;

    return await this.prisma.$transaction(async (tx) => {
      const staff = await tx.staffMember.create({
        data: {
          organizationId: orgId,
          ...staffData,
        },
      });

      if (serviceIds.length > 0) {
        await tx.staffService.createMany({
          data: serviceIds.map((serviceId) => ({
            staffId: staff.id,
            serviceId,
          })),
        });
      }

      // Initialize default 7-day schedule (Sat-Thu 10:00-20:00, Fri off)
      for (let day = 0; day <= 6; day++) {
        const isOff = day === 6;
        await tx.staffSchedule.create({
          data: {
            organizationId: orgId,
            staffId: staff.id,
            dayOfWeek: day,
            isDayOff: isOff,
            shiftsJson: isOff ? '[]' : JSON.stringify([{ startTime: '10:00', endTime: '20:00' }]),
            breaksJson: isOff ? '[]' : JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]),
          },
        });
      }

      return staff;
    });
  }

  async updateStaff(orgId: string, id: string, input: UpdateStaffInput) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!staff) {
      throw new DomainError(DomainErrorCode.STAFF_NOT_FOUND, 'ارائه‌دهنده یافت نشد');
    }

    const { serviceIds, ...staffData } = input;

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.staffMember.update({
        where: { id },
        data: staffData,
      });

      if (serviceIds !== undefined) {
        await tx.staffService.deleteMany({ where: { staffId: id } });
        if (serviceIds.length > 0) {
          await tx.staffService.createMany({
            data: serviceIds.map((serviceId) => ({
              staffId: id,
              serviceId,
            })),
          });
        }
      }

      return updated;
    });
  }
}
