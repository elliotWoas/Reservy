import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Scissors,
  User,
} from 'lucide-react';
import { formatToman } from '@/lib/utils';

async function getOrganization(slug: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${apiBase}/public/organizations/${slug}`, {
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 pb-20">
      {/* Cover & Hero */}
      <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
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

        <div className="absolute bottom-6 right-6 left-6 max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Services & Categories */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
              <Scissors className="w-5 h-5 text-emerald-600" />
              <span>لیست خدمات</span>
            </h2>

            <div className="space-y-4">
              {org.services?.map((service: any) => (
                <div
                  key={service.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/50 transition-all"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs text-slate-500 leading-relaxed max-w-md">{service.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{service.durationMinutes} دقیقه</span>
                      </span>
                      {service.category && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                          {service.category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <span className="text-sm font-black text-emerald-700">{formatToman(service.price)}</span>
                    <Link
                      href={`/book/${org.slug}?serviceId=${service.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
                    >
                      انتخاب و رزرو
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          {org.staffMembers && org.staffMembers.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-emerald-600" />
                <span>ارائه‌دهندگان و متخصصین</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {org.staffMembers.map((staff: any) => (
                  <div
                    key={staff.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5"
                  >
                    {staff.avatarUrl ? (
                      <img
                        src={staff.avatarUrl}
                        alt={staff.displayName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                        {staff.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900">{staff.displayName}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{staff.bio || 'متخصص باتجربه'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Business Info Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
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
              <span>پذیرش پرداخت کارت‌به‌کارت آنلاین</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-emerald-950 text-white shadow-md space-y-3">
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
