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
        badgeText = badgeText || (status === BookingStatus.PENDING_PAYMENT ? 'در انتظار پرداخت' : 'در انتظار پرداخت');
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
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60',
    info: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/60',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variants[computedVariant],
        className
      )}
    >
      {badgeText}
    </span>
  );
}
