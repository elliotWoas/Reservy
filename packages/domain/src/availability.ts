export interface TimeWindow {
  startMinutes: number; // e.g. 10:00 -> 600
  endMinutes: number;   // e.g. 14:00 -> 840
}

export interface DateInterval {
  startAt: Date;
  endAt: Date;
}

export interface DayScheduleInput {
  dayOfWeek: number; // 0=Saturday .. 6=Friday
  shifts: { startTime: string; endTime: string }[]; // "10:00", "20:00"
  breaks?: { startTime: string; endTime: string }[];
  isDayOff?: boolean;
}

export interface BlockedPeriodInput {
  startAt: Date;
  endAt: Date;
  reason?: string;
}

export interface ExistingBookingInput {
  id: string;
  startAt: Date;
  endAt: Date;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}

export interface SlotGenerationParams {
  date: string; // "YYYY-MM-DD"
  timezone?: string; // default "Asia/Tehran"
  serviceDurationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  slotIntervalMinutes?: number; // Granularity/step
  schedule: DayScheduleInput;
  blockedPeriods?: BlockedPeriodInput[];
  existingBookings?: ExistingBookingInput[];
  filterPastSlots?: boolean;
}

export interface AvailableSlot {
  startAt: string; // ISO UTC
  endAt: string;   // ISO UTC
  startTimeLocal: string; // "10:00"
  endTimeLocal: string;   // "10:45"
  durationMinutes: number;
}

/**
 * Converts "HH:MM" to minutes from midnight
 */
export function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: "${time}". Expected HH:MM`);
  }
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to "HH:MM"
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Checks if two intervals overlap: [startA, endA) and [startB, endB)
 */
export function isOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Checks if two Date intervals overlap
 */
export function isDateOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return Math.max(startA.getTime(), startB.getTime()) < Math.min(endA.getTime(), endB.getTime());
}

/**
 * Converts local date string (YYYY-MM-DD) and local time string (HH:MM) in Asia/Tehran to UTC Date.
 * Iran is standard UTC+03:30 (210 minutes ahead of UTC).
 */
export function localTehranToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // UTC timestamp = Tehran local time minus 3 hours and 30 minutes
  const totalUtcMinutes = hours * 60 + minutes - 210;
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, totalUtcMinutes, 0, 0));
  return utcDate;
}

/**
 * Core pure Slot Generation Engine
 */
export function generateAvailableSlots(params: SlotGenerationParams): AvailableSlot[] {
  const {
    date,
    timezone = 'Asia/Tehran',
    serviceDurationMinutes,
    bufferBeforeMinutes = 0,
    bufferAfterMinutes = 0,
    slotIntervalMinutes = 15,
    schedule,
    blockedPeriods = [],
    existingBookings = [],
    filterPastSlots = true,
  } = params;

  if (schedule.isDayOff || !schedule.shifts || schedule.shifts.length === 0) {
    return [];
  }

  const totalRequiredDuration = bufferBeforeMinutes + serviceDurationMinutes + bufferAfterMinutes;
  const availableSlots: AvailableSlot[] = [];
  const now = new Date();

  // Parse shifts into minute intervals
  const shiftWindows: TimeWindow[] = schedule.shifts.map((shift) => ({
    startMinutes: timeStringToMinutes(shift.startTime),
    endMinutes: timeStringToMinutes(shift.endTime),
  }));

  // Parse breaks into minute intervals
  const breakWindows: TimeWindow[] = (schedule.breaks || []).map((brk) => ({
    startMinutes: timeStringToMinutes(brk.startTime),
    endMinutes: timeStringToMinutes(brk.endTime),
  }));

  for (const shift of shiftWindows) {
    let currentMinute = shift.startMinutes;

    while (currentMinute + totalRequiredDuration <= shift.endMinutes) {
      const slotServiceStartMinute = currentMinute + bufferBeforeMinutes;
      const slotServiceEndMinute = slotServiceStartMinute + serviceDurationMinutes;
      const totalBlockStart = currentMinute;
      const totalBlockEnd = currentMinute + totalRequiredDuration;

      // Check collision with shifts (must fit inside the shift window)
      if (totalBlockEnd > shift.endMinutes) {
        currentMinute += slotIntervalMinutes;
        continue;
      }

      // Check collision with Breaks
      const overlapsWithBreak = breakWindows.some((brk) =>
        isOverlapping(totalBlockStart, totalBlockEnd, brk.startMinutes, brk.endMinutes)
      );

      if (overlapsWithBreak) {
        currentMinute += slotIntervalMinutes;
        continue;
      }

      const startTimeLocal = minutesToTimeString(slotServiceStartMinute);
      const endTimeLocal = minutesToTimeString(slotServiceEndMinute);

      // Create UTC Date representing the slot in Asia/Tehran timezone
      const startAt = localTehranToUtc(date, startTimeLocal);
      const endAt = localTehranToUtc(date, endTimeLocal);

      // Automatically filter out slots in the past
      if (filterPastSlots && startAt.getTime() <= now.getTime()) {
        currentMinute += slotIntervalMinutes;
        continue;
      }

      // Check collision with Blocked Periods
      const overlapsWithBlocked = blockedPeriods.some((blocked) =>
        isDateOverlapping(startAt, endAt, new Date(blocked.startAt), new Date(blocked.endAt))
      );

      if (overlapsWithBlocked) {
        currentMinute += slotIntervalMinutes;
        continue;
      }

      // Check collision with Existing Bookings
      const overlapsWithBooking = existingBookings.some((booking) => {
        const bStart = new Date(booking.startAt);
        const bEnd = new Date(booking.endAt);
        const bBufferBefore = (booking.bufferBeforeMinutes || 0) * 60 * 1000;
        const bBufferAfter = (booking.bufferAfterMinutes || 0) * 60 * 1000;
        const effectiveBStart = new Date(bStart.getTime() - bBufferBefore);
        const effectiveBEnd = new Date(bEnd.getTime() + bBufferAfter);

        return isDateOverlapping(startAt, endAt, effectiveBStart, effectiveBEnd);
      });

      if (overlapsWithBooking) {
        currentMinute += slotIntervalMinutes;
        continue;
      }

      availableSlots.push({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        startTimeLocal,
        endTimeLocal,
        durationMinutes: serviceDurationMinutes,
      });

      currentMinute += slotIntervalMinutes;
    }
  }

  return availableSlots;
}
