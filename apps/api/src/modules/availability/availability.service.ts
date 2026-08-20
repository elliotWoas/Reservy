import { prisma } from '@reservy/database';
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

export class AvailabilityService {
  /**
   * Generates discrete available slots for a given service and optional staff member on a date.
   */
  async getAvailableSlots(orgId: string, params: AvailabilityQueryParams): Promise<AvailableSlot[]> {
    const { serviceId, staffId, locationId, date } = params;

    // Verify service exists and belongs to org
    const service = await prisma.service.findFirst({
      where: { id: serviceId, organizationId: orgId, isActive: true, deletedAt: null },
      include: {
        staffServices: {
          include: {
            staff: {
              where: { isActive: true, isBookable: true, deletedAt: null },
            },
          },
        },
      },
    });

    if (!service) {
      throw new DomainError(DomainErrorCode.SERVICE_NOT_FOUND, 'خدمت مورد نظر یافت نشد یا غیرفعال است');
    }

    // Determine target staff members
    let candidateStaffIds: string[] = [];
    if (staffId) {
      const isAssigned = service.staffServices.some((ss) => ss.staffId === staffId && ss.staff);
      if (!isAssigned) {
        throw new DomainError(
          DomainErrorCode.STAFF_DOES_NOT_PROVIDE_SERVICE,
          'این ارائه‌دهنده خدمت انتخاب شده را ارائه نمی‌دهد'
        );
      }
      candidateStaffIds = [staffId];
    } else {
      // Any staff: get all bookable staff offering this service
      candidateStaffIds = service.staffServices
        .filter((ss) => ss.staff && ss.staff.isActive && ss.staff.isBookable)
        .map((ss) => ss.staffId);
    }

    if (candidateStaffIds.length === 0) {
      return [];
    }

    // Parse day of week: Saturday=0 ... Friday=6
    // JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    const targetDateObj = new Date(date + 'T00:00:00Z');
    const jsDay = targetDateObj.getUTCDay();
    // Convert to our custom Persian DayOfWeek: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
    const dayOfWeek = (jsDay + 1) % 7;

    const dayStartUtc = new Date(`${date}T00:00:00.000Z`);
    const dayEndUtc = new Date(`${date}T23:59:59.999Z`);

    const allSlotsMap = new Map<string, AvailableSlot>();

    // Query availability for each candidate staff member
    for (const targetStaffId of candidateStaffIds) {
      // 1. Fetch Staff Schedule for this dayOfWeek
      const schedule = await prisma.staffSchedule.findUnique({
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

      // 2. Fetch Blocked Periods on this date
      const blockedPeriods = await prisma.blockedPeriod.findMany({
        where: {
          organizationId: orgId,
          OR: [{ staffId: targetStaffId }, { staffId: null }],
          startAt: { lt: dayEndUtc },
          endAt: { gt: dayStartUtc },
        },
      });

      // 3. Fetch Existing Bookings on this date
      const existingBookings = await prisma.booking.findMany({
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

      // Run Domain slot generator
      const staffSlots = generateAvailableSlots({
        date,
        serviceDurationMinutes: service.durationMinutes,
        bufferBeforeMinutes: service.bufferBeforeMinutes,
        bufferAfterMinutes: service.bufferAfterMinutes,
        slotIntervalMinutes: 30, // 30 min granularity
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

    // Sort slots chronologically
    return Array.from(allSlotsMap.values()).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }

  async getStaffSchedules(orgId: string, staffId: string) {
    return await prisma.staffSchedule.findMany({
      where: { organizationId: orgId, staffId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async setStaffSchedules(orgId: string, staffId: string, input: SetStaffScheduleInput) {
    return await prisma.$transaction(async (tx) => {
      const results = [];
      for (const day of input.schedules) {
        const res = await tx.staffSchedule.upsert({
          where: {
            staffId_dayOfWeek: {
              staffId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            shiftsJson: JSON.stringify(day.shifts),
            breaksJson: JSON.stringify(day.breaks || []),
            isDayOff: day.isDayOff,
          },
          create: {
            organizationId: orgId,
            staffId,
            dayOfWeek: day.dayOfWeek,
            shiftsJson: JSON.stringify(day.shifts),
            breaksJson: JSON.stringify(day.breaks || []),
            isDayOff: day.isDayOff,
          },
        });
        results.push(res);
      }
      return results;
    });
  }

  async getBlockedPeriods(orgId: string, staffId?: string) {
    return await prisma.blockedPeriod.findMany({
      where: {
        organizationId: orgId,
        ...(staffId ? { staffId } : {}),
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async createBlockedPeriod(orgId: string, input: CreateBlockedPeriodInput) {
    return await prisma.blockedPeriod.create({
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

  async deleteBlockedPeriod(orgId: string, periodId: string) {
    return await prisma.blockedPeriod.deleteMany({
      where: { id: periodId, organizationId: orgId },
    });
  }
}

export const availabilityService = new AvailabilityService();
