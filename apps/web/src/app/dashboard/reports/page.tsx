'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Scissors, UserCheck, Calendar, Award } from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatNumberFa } from '@/lib/utils';

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [sumRes, perfRes] = await Promise.all([
          ApiClient.request<any>('/reporting/summary'),
          ApiClient.request<any>('/reporting/performance'),
        ]);
        setSummary(sumRes);
        setPerformance(perfRes);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">در حال محاسبه گزارش‌های مالی و عملکردی...</div>;
  }

  const metrics = summary?.metrics || {};
  const topServices = performance?.topServices || [];
  const topStaff = performance?.topStaff || [];

  return (
    <div className="space-y-8 animate-fade-in text-right">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">گزارش‌های مالی و عملکرد</h1>
        <p className="text-xs text-slate-500">تحلیل درآمدهای تایید شده، پرفروش‌ترین خدمات و بهترین اعضای تیم</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="درآمد امروز"
          value={formatToman(metrics.revenueToday || 0)}
          icon={TrendingUp}
          subtitle="تراکنش‌های تایید شده امروز"
        />
        <StatCard
          title="درآمد ۷ روز اخیر"
          value={formatToman(metrics.revenueWeek || 0)}
          icon={Calendar}
          subtitle="مجموع دریافتی‌های هفته گذشته"
        />
        <StatCard
          title="درآمد ماه جاری"
          value={formatToman(metrics.revenueMonth || 0)}
          icon={BarChart3}
          subtitle="عملکرد مالی کل ماه"
        />
      </div>

      {/* Two Column Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Scissors className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">پرفروش‌ترین خدمات</h3>
              <p className="text-[11px] text-slate-500">رتبه‌بندی بر اساس تعداد نوبت‌های انجام شده</p>
            </div>
          </div>

          <div className="space-y-3">
            {topServices.map((s: any, idx: number) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {formatNumberFa(idx + 1)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                    <span className="text-[10px] text-slate-500">قیمت واحد: {formatToman(s.price)}</span>
                  </div>
                </div>
                <div className="text-left space-y-0.5">
                  <span className="text-xs font-black text-emerald-700 block">
                    {formatNumberFa(s.totalCompletedBookings)} نوبت
                  </span>
                  <span className="text-[10px] text-slate-400">
                    درآمد تخمینی: {formatToman(s.estimatedRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Staff Members */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Award className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">عملکرد اعضای تیم</h3>
              <p className="text-[11px] text-slate-500">تعداد نوبت‌های ثبت شده و انجام شده توسط هر فرد</p>
            </div>
          </div>

          <div className="space-y-3">
            {topStaff.map((st: any, idx: number) => (
              <div
                key={st.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                    {formatNumberFa(idx + 1)}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{st.displayName}</h4>
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-slate-800">
                    {formatNumberFa(st.totalCompletedBookings)} نوبت موفق
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
