import React from 'react';
import { cn } from '@/lib/utils';
import { BookingStatus, PaymentStatus } from '@reservy/domain';

export interface BadgeProps {
  status?: BookingStatus | PaymentStatus | string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ status, variant, children, className }: BadgeProps) {
  let badgeText = children;
  let computedVariant: 'default' | 'success' | 'warning' | 'danger' | 'info' = variant || 'default';

  if (status) {
    switch (status) {
      case BookingStatus.CONFIRMED:
      case PaymentStatus.VERIFIED:
        badgeText = badgeText || (status === BookingStatus.CONFIRMED ? 'تایید شده' : 'پرداخت تایید شد');
        computedVariant = 'success';
        break;
      case BookingStatus.COMPLETED:
        badgeText = badgeText || 'تکمیل شده';
        computedVariant = 'info';
        break;
      case BookingStatus.PENDING_PAYMENT:
      case PaymentStatus.PENDING:
        badgeText = badgeText || 'در انتظار پرداخت';
        computedVariant = 'warning';
        break;
      case BookingStatus.PAYMENT_SUBMITTED:
      case PaymentStatus.PROOF_SUBMITTED:
        badgeText = badgeText || 'رسید ارسال شد';
        computedVariant = 'warning';
        break;
      case BookingStatus.PAYMENT_REVIEW:
      case PaymentStatus.UNDER_REVIEW:
        badgeText = badgeText || 'در حال بررسی';
        computedVariant = 'warning';
        break;
      case BookingStatus.CANCELLED:
        badgeText = badgeText || 'لغو شده';
        computedVariant = 'danger';
        break;
      case BookingStatus.NO_SHOW:
        badgeText = badgeText || 'عدم مراجعه';
        computedVariant = 'danger';
        break;
      case BookingStatus.REJECTED:
      case PaymentStatus.REJECTED:
        badgeText = badgeText || 'رد شده';
        computedVariant = 'danger';
        break;
      case PaymentStatus.REFUNDED:
        badgeText = badgeText || 'مسترد شده';
        computedVariant = 'default';
        break;
    }
  }

  const variants = {
    default: 'bg-slate-800/90 text-slate-300 border-slate-700/80',
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    info: 'bg-sky-950/80 text-sky-300 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 mx-2 py-0.5  rounded-xl text-xs  border select-none',
        variants[computedVariant],
        className
      )}
    >
      {badgeText}
    </span>
  );
}
