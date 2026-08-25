'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Building2, Sparkles } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { Avatar } from '@/components/ui/Avatar';

export function DashboardHeader({ user, organization }: { user?: any; organization?: any }) {
  const router = useRouter();

  const handleLogout = () => {
    ApiClient.removeToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 text-right shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-emerald-100/60 dark:border-slate-700">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{organization?.name || 'کسب‌وکار من'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.fullName || 'کاربر'} size="sm" />
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">{user?.fullName || 'مدیریت'}</span>
            <span className="block text-[10px] text-slate-400 font-medium">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="خروج از حساب"
          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
