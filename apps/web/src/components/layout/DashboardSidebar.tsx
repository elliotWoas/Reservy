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
    <aside className="hidden lg:flex flex-col w-64 border-l border-amber-500/10 bg-[#0E131F]/95 backdrop-blur-xl min-h-screen text-right select-none shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
      {/* Brand Header */}
      <div className="p-6 border-b border-amber-500/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black text-xl shadow-luxury-sm">
            R
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black text-base text-white tracking-tight">رزِروی</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="block text-[10px] text-amber-400/80 font-bold">پلتفرم مدیریت رزرو هوشمند</span>
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
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 font-extrabold border border-amber-500/30 shadow-luxury-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-amber-400' : 'text-slate-500')} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-amber-500/10">
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors',
                pathname === '/admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-purple-400 hover:bg-purple-500/10'
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
        <div className="p-4 border-t border-amber-500/10">
          <Link
            href={`/${orgSlug}`}
            target="_blank"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 text-xs font-bold text-slate-300 hover:text-amber-300 transition-all border border-amber-500/20 shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>مشاهده صفحه مشتریان</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-black/40 text-amber-400/80 font-mono">
              /{orgSlug}
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}
