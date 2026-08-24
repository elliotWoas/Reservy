import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  BookingStatus,
  DomainError,
  DomainErrorCode,
  generateAvailableSlots,
  AvailableSlot,
} from '@reservy/domain';
import {
  AvailabilityQueryParams,
  SetStaffScheduleInput,
  CreateBlockedPeriodInput,
} from '@reservy/validation';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates discrete available slots for a given service and optional staff member on a date.
   */
  async getAvailableSlots(orgId: string, params: AvailabilityQueryParams): Promise<AvailableSlot[]> {
    const { serviceId, staffId, date } = params;

    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, organizationId: orgId, isActive: true, deletedAt: null },
      include: {
        staffServices: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (!service) {
      throw new DomainError(DomainErrorCode.SERVICE_NOT_FOUND, 'خدمت مورد نظر یافت نشد یا غیرفعال است');
    }

    let candidateStaffIds: string[] = [];
    if (staffId) {
      const isAssigned = service.staffServices.some(
        (ss) => ss.staffId === staffId && ss.staff && ss.staff.isActive && ss.staff.isBookable && !ss.staff.deletedAt
      );
      if (!isAssigned) {
        throw new DomainError(
          DomainErrorCode.STAFF_DOES_NOT_PROVIDE_SERVICE,
          'این ارائه‌دهنده خدمت انتخاب شده را ارائه نمی‌دهد'
        );
      }
      candidateStaffIds = [staffId];
    } else {
      candidateStaffIds = service.staffServices
        .filter((ss) => ss.staff && ss.staff.isActive && ss.staff.isBookable && !ss.staff.deletedAt)
        .map((ss) => ss.staffId);
    }

    if (candidateStaffIds.length === 0) {
      return [];
    }

    const targetDateObj = new Date(date + 'T00:00:00Z');
    const jsDay = targetDateObj.getUTCDay();
    const dayOfWeek = (jsDay + 1) % 7;

    const dayStartUtc = new Date(`${date}T00:00:00.000Z`);
    const dayEndUtc = new Date(`${date}T23:59:59.999Z`);

    const allSlotsMap = new Map<string, AvailableSlot>();

    for (const targetStaffId of candidateStaffIds) {
      const schedule = await this.prisma.staffSchedule.findUnique({
        where: {
          staffId_dayOfWeek: {
            staffId: targetStaffId,
            dayOfWeek,
          },
        },
      });

      if (!schedule || schedule.isDayOff) {
        continue;
      }

      const shifts = JSON.parse(schedule.shiftsJson || '[]');
      const breaks = JSON.parse(schedule.breaksJson || '[]');

      if (shifts.length === 0) {
        continue;
      }

      const blockedPeriods = await this.prisma.blockedPeriod.findMany({
        where: {
          organizationId: orgId,
          OR: [{ staffId: targetStaffId }, { staffId: null }],
          startAt: { lt: dayEndUtc },
          endAt: { gt: dayStartUtc },
        },
      });

      const existingBookings = await this.prisma.booking.findMany({
        where: {
          organizationId: orgId,
          staffId: targetStaffId,
          startAt: { lt: dayEndUtc },
          endAt: { gt: dayStartUtc },
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
          },
          deletedAt: null,
        },
        include: {
          service: true,
        },
      });

      const slotStep = service.durationMinutes > 0 ? service.durationMinutes : 30;

      const staffSlots = generateAvailableSlots({
        date,
        serviceDurationMinutes: service.durationMinutes,
        bufferBeforeMinutes: service.bufferBeforeMinutes,
        bufferAfterMinutes: service.bufferAfterMinutes,
        slotIntervalMinutes: slotStep,
        schedule: {
          dayOfWeek,
          shifts,
          breaks,
          isDayOff: schedule.isDayOff,
        },
        blockedPeriods: blockedPeriods.map((bp) => ({
          startAt: bp.startAt,
          endAt: bp.endAt,
          reason: bp.reason || undefined,
        })),
        existingBookings: existingBookings.map((b) => ({
          id: b.id,
          startAt: b.startAt,
          endAt: b.endAt,
          bufferBeforeMinutes: b.service?.bufferBeforeMinutes || 0,
          bufferAfterMinutes: b.service?.bufferAfterMinutes || 0,
        })),
      });

      for (const slot of staffSlots) {
        allSlotsMap.set(slot.startAt, slot);
      }
    }

    return Array.from(allSlotsMap.values()).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }

  async setStaffSchedule(orgId: string, input: SetStaffScheduleInput & { staffId: string }) {
    const { staffId, schedules } = input;

    const staff = await this.prisma.staffMember.findFirst({
      where: { id: staffId, organizationId: orgId, deletedAt: null },
    });

    if (!staff) {
      throw new DomainError(DomainErrorCode.STAFF_NOT_FOUND, 'ارائه‌دهنده یافت نشد');
    }

    return await this.prisma.$transaction(
      schedules.map((s) =>
        this.prisma.staffSchedule.upsert({
          where: {
            staffId_dayOfWeek: {
              staffId,
              dayOfWeek: s.dayOfWeek,
            },
          },
          update: {
            shiftsJson: JSON.stringify(s.shifts),
            breaksJson: JSON.stringify(s.breaks || []),
            isDayOff: s.isDayOff,
          },
          create: {
            organizationId: orgId,
            staffId,
            dayOfWeek: s.dayOfWeek,
            shiftsJson: JSON.stringify(s.shifts),
            breaksJson: JSON.stringify(s.breaks || []),
            isDayOff: s.isDayOff,
          },
        })
      )
    );
  }

  async getStaffSchedule(orgId: string, staffId: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id: staffId, organizationId: orgId, deletedAt: null },
    });

    if (!staff) {
      throw new DomainError(DomainErrorCode.STAFF_NOT_FOUND, 'ارائه‌دهنده یافت نشد');
    }

    return await this.prisma.staffSchedule.findMany({
      where: { staffId, organizationId: orgId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async createBlockedPeriod(orgId: string, input: CreateBlockedPeriodInput) {
    return await this.prisma.blockedPeriod.create({
      data: {
        organizationId: orgId,
        staffId: input.staffId,
        locationId: input.locationId,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        reason: input.reason,
      },
    });
  }

  async getBlockedPeriods(orgId: string, staffId?: string) {
    const where: any = { organizationId: orgId };
    if (staffId) {
      where.OR = [{ staffId }, { staffId: null }];
    }
    return await this.prisma.blockedPeriod.findMany({
      where,
      include: { staff: true, location: true },
      orderBy: { startAt: 'asc' },
    });
  }

  async deleteBlockedPeriod(orgId: string, id: string) {
    return await this.prisma.blockedPeriod.deleteMany({
      where: { id, organizationId: orgId },
    });
  }
}
