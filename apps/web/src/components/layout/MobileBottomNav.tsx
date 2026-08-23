'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, BookMarked, CreditCard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { label: 'پیشخوان', href: '/dashboard', icon: LayoutDashboard },
    { label: 'تقویم', href: '/dashboard/calendar', icon: Calendar },
    { label: 'نوبت‌ها', href: '/dashboard/bookings', icon: BookMarked },
    { label: 'پرداخت‌ها', href: '/dashboard/payments', icon: CreditCard },
    { label: 'مشتریان', href: '/dashboard/customers', icon: Users },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-colors',
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
