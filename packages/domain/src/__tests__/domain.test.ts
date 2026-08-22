import { describe, it, expect } from 'bun:test';
import {
  UserRole,
  Permission,
  BookingStatus,
  PaymentStatus,
  hasPermission,
  canTransitionBooking,
  canTransitionPayment,
  tomanToRial,
  rialToToman,
  formatToman,
  timeStringToMinutes,
  minutesToTimeString,
  isOverlapping,
  generateAvailableSlots,
  localTehranToUtc,
} from '../index';

describe('Domain - Permissions', () => {
  it('PLATFORM_ADMIN has all permissions', () => {
    expect(hasPermission(UserRole.PLATFORM_ADMIN, Permission.ORGANIZATION_UPDATE)).toBe(true);
    expect(hasPermission(UserRole.PLATFORM_ADMIN, Permission.PLATFORM_MANAGE)).toBe(true);
  });

  it('STAFF has limited permissions', () => {
    expect(hasPermission(UserRole.STAFF, Permission.BOOKING_READ)).toBe(true);
    expect(hasPermission(UserRole.STAFF, Permission.ORGANIZATION_UPDATE)).toBe(false);
    expect(hasPermission(UserRole.STAFF, Permission.PLATFORM_MANAGE)).toBe(false);
  });
});

describe('Domain - State Machine', () => {
  it('validates booking state transitions', () => {
    // Valid: PENDING_PAYMENT -> PAYMENT_SUBMITTED -> CONFIRMED -> COMPLETED
    expect(canTransitionBooking(BookingStatus.PENDING_PAYMENT, BookingStatus.PAYMENT_SUBMITTED).valid).toBe(true);
    expect(canTransitionBooking(BookingStatus.PAYMENT_SUBMITTED, BookingStatus.CONFIRMED).valid).toBe(true);
    expect(canTransitionBooking(BookingStatus.CONFIRMED, BookingStatus.COMPLETED).valid).toBe(true);

    // Invalid: COMPLETED -> PENDING_PAYMENT
    expect(canTransitionBooking(BookingStatus.COMPLETED, BookingStatus.PENDING_PAYMENT).valid).toBe(false);
  });

  it('validates payment state transitions', () => {
    expect(canTransitionPayment(PaymentStatus.PENDING, PaymentStatus.PROOF_SUBMITTED).valid).toBe(true);
    expect(canTransitionPayment(PaymentStatus.PROOF_SUBMITTED, PaymentStatus.VERIFIED).valid).toBe(true);
    expect(canTransitionPayment(PaymentStatus.VERIFIED, PaymentStatus.PENDING).valid).toBe(false);
  });
});

describe('Domain - Money Handling', () => {
  it('handles integer amounts and formats correctly', () => {
    expect(tomanToRial(50000)).toBe(500000);
    expect(rialToToman(500000)).toBe(50000);
    expect(formatToman(120000)).toContain('تومان');
  });
});

describe('Domain - Availability Engine', () => {
  it('converts time strings and minutes correctly', () => {
    expect(timeStringToMinutes('10:30')).toBe(630);
    expect(minutesToTimeString(630)).toBe('10:30');
    expect(isOverlapping(600, 660, 630, 700)).toBe(true);
    expect(isOverlapping(600, 630, 630, 700)).toBe(false);
  });

  it('generates slots based on shifts and filters out breaks and bookings', () => {
    const slots = generateAvailableSlots({
      date: '2026-08-20',
      serviceDurationMinutes: 45,
      slotIntervalMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      filterPastSlots: false,
      schedule: {
        dayOfWeek: 0,
        shifts: [{ startTime: '10:00', endTime: '14:00' }],
        breaks: [{ startTime: '12:00', endTime: '13:00' }],
      },
      existingBookings: [
        {
          id: 'b1',
          startAt: localTehranToUtc('2026-08-20', '10:00'),
          endAt: localTehranToUtc('2026-08-20', '10:45'),
        },
      ],
    });

    // 10:00 is booked
    expect(slots.some((s) => s.startTimeLocal === '10:00')).toBe(false);
    // 10:30 overlaps with 10:00-10:45 booking, so not available
    expect(slots.some((s) => s.startTimeLocal === '10:30')).toBe(false);
    // 11:00 should be available (11:00 - 11:45 finishes before 12:00 break)
    expect(slots.some((s) => s.startTimeLocal === '11:00')).toBe(true);
    // 11:30 would overlap with break (11:30 - 12:15 crosses 12:00)
    expect(slots.some((s) => s.startTimeLocal === '11:30')).toBe(false);
    // 13:00 should be available (13:00 - 13:45 finishes before 14:00)
    expect(slots.some((s) => s.startTimeLocal === '13:00')).toBe(true);
  });
});
