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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E131F]/95 backdrop-blur-xl border-t border-amber-500/15 px-2 py-1.5 flex justify-around select-none shadow-2xl">
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
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
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
