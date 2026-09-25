import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import StorefrontTabs from '@/components/layout/StorefrontTabs';
import { resolveApiUrl } from '@/lib/config';

async function getOrganization(slug: string) {
  try {
    const res = await fetch(resolveApiUrl(`/public/organizations/${slug}`), {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (err) {
    return null;
  }
}

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const org = await getOrganization(params.slug);

  if (!org) {
    notFound();
  }

  const primaryLocation = org.locations?.[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 pb-10" dir="rtl">
      {/* Cover & Hero */}
      <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden rounded-b-3xl border-b-black shadow-2xl">
        {org.coverUrl ? (
          <img
            src={org.coverUrl}
            alt={org.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-4 right-6 left-6 max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            {org.logoUrl ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl bg-white"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-2xl border-2 border-white/20 shadow-xl">
                {org.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{org.name}</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-1 max-w-xl">{org.description}</p>
            </div>
          </div>

          <Link
            href={`/book/${org.slug}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>رزرو آنلاین نوبت</span>
          </Link>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-5xl mx-auto px-0 sm:px-6 pt-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* کامپوننت تب‌های اسکرولی تعاملی */}
        <div className="lg:col-span-2">
          <StorefrontTabs org={org} primaryLocation={primaryLocation} />
        </div>

        {/* سایدبار اطلاعات ثابت */}
        <div className="space-y-3">
          <div className="mx-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">اطلاعات کسب‌وکار</h3>

            {primaryLocation?.address && (
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{primaryLocation.address}</span>
              </div>
            )}

            {org.phone && (
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span dir="ltr">{org.phone}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>پذیرش پرداخت آنلاین و کارت‌به‌کارت</span>
            </div>
          </div>

          <div className="mx-2 p-6 rounded-xl  bg-emerald-950 text-white shadow-md space-y-3">
            <h3 className="text-sm font-bold">رزرو سریع در ۲ دقیقه</h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              بدون نیاز به ثبت‌نام طولانی، خدمت و زمان دلخواه خود را انتخاب کنید و نوبت خود را قطعی نمایید.
            </p>
            <Link
              href={`/book/${org.slug}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              <span>شروع رزرو نوبت</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}