'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Scissors,
} from 'lucide-react';
import { StatCard, Card, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatTimeFa, formatNumberFa } from '@/lib/utils';

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await ApiClient.request<any>('/reporting/summary');
        setSummary(data);
      } catch (err) {
        console.error('Failed to load dashboard summary', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">در حال دریافت آمار داشبورد...</div>;
  }

  const metrics = summary?.metrics || {};

  return (
    <div className="space-y-8 animate-fade-in text-right">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">پیشخوان مدیریت</h1>
          <p className="text-xs text-slate-500 mt-0.5">خلاصه وضعیت نوبت‌ها و دریافتی‌های کسب‌وکار</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/calendar">
            <Button size="sm" variant="outline" className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>مشاهده تقویم</span>
            </Button>
          </Link>
          <Link href="/dashboard/calendar?new=1">
            <Button size="sm" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>ثبت نوبت دستی</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="نوبت‌های امروز"
          value={formatNumberFa(metrics.todayBookingsCount || 0)}
          icon={Calendar}
          subtitle="رزروهای ثبت شده برای امروز"
        />
        <StatCard
          title="درآمد امروز (تایید شده)"
          value={formatToman(metrics.revenueToday || 0)}
          icon={TrendingUp}
          subtitle={`درآمد این ماه: ${formatToman(metrics.revenueMonth || 0)}`}
        />
        <StatCard
          title="رسیدهای در انتظار بررسی"
          value={formatNumberFa(metrics.pendingPaymentsCount || 0)}
          icon={CreditCard}
          subtitle="پرداخت کارت‌به‌کارت نیازمند تایید"
          className={metrics.pendingPaymentsCount > 0 ? 'ring-2 ring-amber-500/30' : ''}
        />
        <StatCard
          title="کل مشتریان در CRM"
          value={formatNumberFa(metrics.totalCustomersCount || 0)}
          icon={Users}
          subtitle="پرونده‌های فعال ثبت شده"
        />
      </div>

      {/* Two Column Layout: Upcoming Bookings & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments Alert Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">رسیدهای پرداخت نیازمند تایید</h3>
            </div>
            <Link href="/dashboard/payments" className="text-xs font-bold text-emerald-600 hover:underline">
              مشاهده همه
            </Link>
          </div>

          {summary?.recentPendingPayments?.length === 0 ? (
            <EmptyState
              title="رسید معوقه‌ای وجود ندارد"
              description="تمام پرداخت‌های کارت‌به‌کارت بررسی و تایید شده‌اند."
              icon={CheckCircle2}
            />
          ) : (
            <div className="space-y-3">
              {summary?.recentPendingPayments?.map((payment: any) => (
                <div
                  key={payment.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{payment.booking?.customer?.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{payment.booking?.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{payment.booking?.service?.name}</p>
                  </div>
                  <div className="text-left space-y-1">
                    <span className="text-xs font-black text-emerald-700 block">{formatToman(payment.amount)}</span>
                    <Link
                      href="/dashboard/payments"
                      className="inline-block px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                    >
                      بررسی رسید
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Upcoming Bookings */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">نوبت‌های پیش‌رو امروز</h3>
            </div>
            <Link href="/dashboard/bookings" className="text-xs font-bold text-emerald-600 hover:underline">
              مشاهده همه نوبت‌ها
            </Link>
          </div>

          {summary?.upcomingToday?.length === 0 ? (
            <EmptyState
              title="برای ساعات باقی‌مانده امروز نوبتی ثبت نشده است"
              description="می‌توانید به صورت دستی برای مشتریان نوبت جدید ثبت کنید."
              icon={Calendar}
            />
          ) : (
            <div className="space-y-3">
              {summary?.upcomingToday?.map((booking: any) => (
                <div
                  key={booking.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{booking.customer?.fullName}</span>
                      <Badge status={booking.status} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {booking.service?.name} با {booking.staff?.displayName || 'ارائه‌دهنده'}
                    </p>
                  </div>
                  <div className="text-left space-y-0.5">
                    <span className="text-xs font-black text-slate-800 block">{formatTimeFa(booking.startAt)}</span>
                    <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{booking.customer?.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
