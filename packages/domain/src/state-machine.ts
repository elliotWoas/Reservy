import { BookingStatus, PaymentStatus, PaymentProofReviewStatus } from './enums';

export interface StateTransitionResult {
  valid: boolean;
  reason?: string;
}

// Valid Booking Status Transitions
const VALID_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING_PAYMENT]: [
    BookingStatus.PAYMENT_SUBMITTED,
    BookingStatus.PAYMENT_REVIEW,
    BookingStatus.CONFIRMED,
    BookingStatus.CANCELLED,
    BookingStatus.REJECTED,
  ],
  [BookingStatus.PAYMENT_SUBMITTED]: [
    BookingStatus.PAYMENT_REVIEW,
    BookingStatus.CONFIRMED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.PAYMENT_REVIEW]: [
    BookingStatus.CONFIRMED,
    BookingStatus.REJECTED,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
    BookingStatus.NO_SHOW,
  ],
  [BookingStatus.IN_PROGRESS]: [
    BookingStatus.COMPLETED,
    BookingStatus.NO_SHOW,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.COMPLETED]: [], // Terminal state
  [BookingStatus.CANCELLED]: [], // Terminal state
  [BookingStatus.NO_SHOW]: [],   // Terminal state
  [BookingStatus.REJECTED]: [BookingStatus.PENDING_PAYMENT, BookingStatus.CANCELLED],
};

export function canTransitionBooking(
  current: BookingStatus,
  next: BookingStatus
): StateTransitionResult {
  if (current === next) {
    return { valid: true };
  }
  const allowed = VALID_BOOKING_TRANSITIONS[current] || [];
  if (allowed.includes(next)) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: `Invalid booking status transition from ${current} to ${next}`,
  };
}

// Valid Payment Status Transitions
const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROOF_SUBMITTED,
    PaymentStatus.UNDER_REVIEW,
    PaymentStatus.VERIFIED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.PROOF_SUBMITTED]: [
    PaymentStatus.UNDER_REVIEW,
    PaymentStatus.VERIFIED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.UNDER_REVIEW]: [
    PaymentStatus.VERIFIED,
    PaymentStatus.REJECTED,
  ],
  [PaymentStatus.VERIFIED]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.REJECTED]: [
    PaymentStatus.PROOF_SUBMITTED,
  ],
  [PaymentStatus.REFUNDED]: [], // Terminal state
};

export function canTransitionPayment(
  current: PaymentStatus,
  next: PaymentStatus
): StateTransitionResult {
  if (current === next) {
    return { valid: true };
  }
  const allowed = VALID_PAYMENT_TRANSITIONS[current] || [];
  if (allowed.includes(next)) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: `Invalid payment status transition from ${current} to ${next}`,
  };
}
