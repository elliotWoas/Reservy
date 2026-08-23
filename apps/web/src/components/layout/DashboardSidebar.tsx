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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardSidebar({ orgSlug, isSuperAdmin }: { orgSlug?: string; isSuperAdmin?: boolean }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'پیشخوان', href: '/dashboard', icon: LayoutDashboard },
    { label: 'تقویم کاری', href: '/dashboard/calendar', icon: Calendar },
    { label: 'ساعات کاری و سانس‌ها', href: '/dashboard/schedule', icon: Clock },
    { label: 'نوبت‌ها', href: '/dashboard/bookings', icon: BookMarked },
    { label: 'مشتریان (CRM)', href: '/dashboard/customers', icon: Users },
    { label: 'خدمات', href: '/dashboard/services', icon: Scissors },
    { label: 'تیم و ارائه‌دهندگان', href: '/dashboard/team', icon: UserCheck },
    { label: 'پرداخت‌ها و رسیدها', href: '/dashboard/payments', icon: CreditCard },
    { label: 'گزارش‌های مالی', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'تنظیمات کسب‌وکار', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-l border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen text-right select-none">
      {/* Brand */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            R
          </div>
          <div>
            <span className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight">رزِروی</span>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">پلتفرم مدیریت رزرو آنلاین</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors',
                pathname === '/admin'
                  ? 'bg-purple-50 text-purple-700'
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
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors border border-slate-200/60 dark:border-slate-800"
          >
            <span>مشاهده صفحه رزرو عمومی</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </aside>
  );
}
