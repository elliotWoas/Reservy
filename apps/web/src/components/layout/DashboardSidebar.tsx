'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  BookMarked,
  Users,
  Scissors,
  UserCheck,
  CreditCard,
  BarChart3,
  Settings,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardSidebar({ orgSlug, isSuperAdmin }: { orgSlug?: string; isSuperAdmin?: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'پیشخوان', href: '/dashboard', icon: LayoutDashboard },
    { label: 'تقویم کاری', href: '/dashboard/calendar', icon: Calendar },
    { label: 'ساعات کاری و سانس‌ها', href: '/dashboard/schedule', icon: Clock },
    { label: 'مدیریت نوبت‌ها', href: '/dashboard/bookings', icon: BookMarked },
    { label: 'مشتریان (CRM)', href: '/dashboard/customers', icon: Users },
    { label: 'خدمات', href: '/dashboard/services', icon: Scissors },
    { label: 'تیم و ارائه‌دهندگان', href: '/dashboard/team', icon: UserCheck },
    { label: 'پرداخت‌ها و فیش‌ها', href: '/dashboard/payments', icon: CreditCard },
    { label: 'گزارش‌های مالی', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'تنظیمات کسب‌وکار', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-l border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl min-h-screen text-right select-none shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-600/20">
            R
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">رزِروی</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">پلتفرم مدیریت رزرو هوشمند</span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/60 dark:to-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-extrabold shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors',
                pathname === '/admin'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                  : 'text-purple-600 hover:bg-purple-50/50'
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>پنل سوپر ادمین</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Public Booking Link Footer */}
      {orgSlug && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href={`/${orgSlug}`}
            target="_blank"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 dark:bg-slate-800/60 hover:border-emerald-300 dark:hover:bg-emerald-950/40 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 transition-all border border-slate-200/70 dark:border-slate-800 shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>مشاهده صفحه مشتریان</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 text-slate-500 font-mono">
              /{orgSlug}
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}
