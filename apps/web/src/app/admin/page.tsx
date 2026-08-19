'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Users,
  BookMarked,
  TrendingUp,
  Power,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatNumberFa } from '@/lib/utils';

export default function SuperAdminPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.request<any>('/admin/overview');
      setOverview(data);
    } catch (err: any) {
      console.error('Super admin fetch failed', err);
      if (err.code === 'FORBIDDEN_PERMISSION') {
        alert('شما دسترسی سوپر ادمین ندارید');
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleToggleOrgStatus = async (orgId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await ApiClient.request(`/admin/organizations/${orgId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchOverview();
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت کسب‌وکار');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-xs font-semibold text-slate-400">در حال بارگذاری پنل سوپر ادمین...</div>
      </div>
    );
  }

  const metrics = overview?.metrics || {};
  const orgs = overview?.recentOrganizations || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 selection:bg-purple-500 text-right">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">پنل نظارت سوپر ادمین پلتفرم</h1>
              <p className="text-xs text-slate-400">مدیریت کلان مستأجرها (Tenants)، کسب‌وکارها و ترافیک کل سیستم</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <span>داشبورد کسب‌وکار</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Global Platform Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800 text-white">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">کل مستأجرها (Tenants)</span>
              <p className="text-2xl font-black text-purple-400">{formatNumberFa(metrics.tenantsCount || 0)}</p>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">کسب‌وکارهای فعال</span>
              <p className="text-2xl font-black text-emerald-400">{formatNumberFa(metrics.orgsCount || 0)}</p>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">کل رزروهای پلتفرم</span>
              <p className="text-2xl font-black text-sky-400">{formatNumberFa(metrics.bookingsCount || 0)}</p>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-white">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">حجم کل تراکنش‌های تایید شده</span>
              <p className="text-xl font-black text-emerald-400">{formatToman(metrics.totalProcessedVolume || 0)}</p>
            </div>
          </Card>
        </div>

        {/* Organizations Table */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-200">لیست کسب‌وکارها و وضعیت فعالیت</h2>

          <Card className="bg-slate-900 border-slate-800 p-0 overflow-hidden text-white">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/60 border-b border-slate-800 text-slate-400 font-bold">
                  <tr>
                    <th className="p-4">نام کسب‌وکار</th>
                    <th className="p-4">مستأجر (Tenant)</th>
                    <th className="p-4">شناسه آدرس (Slug)</th>
                    <th className="p-4">تعداد رزروها</th>
                    <th className="p-4">پرسنل</th>
                    <th className="p-4">وضعیت</th>
                    <th className="p-4 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {orgs.map((org: any) => (
                    <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">{org.name}</td>
                      <td className="p-4 text-slate-400">{org.tenant?.name}</td>
                      <td className="p-4 font-mono text-emerald-400" dir="ltr">/{org.slug}</td>
                      <td className="p-4 font-bold">{formatNumberFa(org._count?.bookings || 0)}</td>
                      <td className="p-4 text-slate-400">{formatNumberFa(org._count?.staffMembers || 0)} نفر</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            org.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {org.status === 'ACTIVE' ? 'فعال' : 'تعلیق شده'}
                        </span>
                      </td>
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${org.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="مشاهده صفحه عمومی"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleToggleOrgStatus(org.id, org.status)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              org.status === 'ACTIVE'
                                ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300'
                                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300'
                            }`}
                          >
                            {org.status === 'ACTIVE' ? 'تعلیق کسب‌وکار' : 'فعال‌سازی'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
