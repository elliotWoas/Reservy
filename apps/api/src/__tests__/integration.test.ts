import { describe, it, expect } from 'bun:test';
import {
  BookingStatus,
  PaymentStatus,
  canTransitionBooking,
  canTransitionPayment,
  generateAvailableSlots,
  localTehranToUtc,
} from '@reservy/domain';
import { normalizePhone } from '@reservy/validation';

describe('Integration - Availability & Slot Conflict Engine', () => {
  it('prevents overlapping candidate slots across existing bookings', () => {
    const slots = generateAvailableSlots({
      date: '2026-09-01',
      serviceDurationMinutes: 60,
      slotIntervalMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      filterPastSlots: false,
      schedule: {
        dayOfWeek: 3, // Tuesday
        shifts: [{ startTime: '09:00', endTime: '13:00' }],
        breaks: [{ startTime: '11:00', endTime: '12:00' }],
      },
      existingBookings: [
        {
          id: 'existing-1',
          startAt: localTehranToUtc('2026-09-01', '09:00'),
          endAt: localTehranToUtc('2026-09-01', '10:00'),
        },
      ],
    });

    // 09:00 is booked -> not available
    expect(slots.some((s) => s.startTimeLocal === '09:00')).toBe(false);
    // 09:30 overlaps with 09:00-10:00 booking -> not available
    expect(slots.some((s) => s.startTimeLocal === '09:30')).toBe(false);
    // 10:00 is available (10:00 - 11:00 fits perfectly before 11:00 break)
    expect(slots.some((s) => s.startTimeLocal === '10:00')).toBe(true);
    // 10:30 overlaps with 11:00 break -> not available
    expect(slots.some((s) => s.startTimeLocal === '10:30')).toBe(false);
    // 11:00 is break -> not available
    expect(slots.some((s) => s.startTimeLocal === '11:00')).toBe(false);
    // 12:00 is available (12:00 - 13:00)
    expect(slots.some((s) => s.startTimeLocal === '12:00')).toBe(true);
  });
});

describe('Integration - State Transitions & Verification Logic', () => {
  it('follows correct payment proof approval flow', () => {
    // Flow: PENDING -> PROOF_SUBMITTED -> VERIFIED
    expect(canTransitionPayment(PaymentStatus.PENDING, PaymentStatus.PROOF_SUBMITTED).valid).toBe(true);
    expect(canTransitionPayment(PaymentStatus.PROOF_SUBMITTED, PaymentStatus.VERIFIED).valid).toBe(true);

    // Booking: PENDING_PAYMENT -> PAYMENT_SUBMITTED -> CONFIRMED -> COMPLETED
    expect(canTransitionBooking(BookingStatus.PENDING_PAYMENT, BookingStatus.PAYMENT_SUBMITTED).valid).toBe(true);
    expect(canTransitionBooking(BookingStatus.PAYMENT_SUBMITTED, BookingStatus.CONFIRMED).valid).toBe(true);
    expect(canTransitionBooking(BookingStatus.CONFIRMED, BookingStatus.COMPLETED).valid).toBe(true);

    // Invalid terminal transition
    expect(canTransitionBooking(BookingStatus.COMPLETED, BookingStatus.PENDING_PAYMENT).valid).toBe(false);
  });

  it('normalizes Iranian and international phone numbers', () => {
    expect(normalizePhone('09121234567')).toBe('09121234567');
    expect(normalizePhone('+989121234567')).toBe('09121234567');
    expect(normalizePhone('00989121234567')).toBe('09121234567');
    expect(normalizePhone('9121234567')).toBe('09121234567');
    expect(normalizePhone('0912-123-4567')).toBe('09121234567');
  });
});
