'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export function DashboardHeader({ user, organization }: { user?: any; organization?: any }) {
  const router = useRouter();

  const handleLogout = () => {
    ApiClient.removeToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 text-right">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{organization?.name || 'کسب‌وکار من'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            {user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{user?.fullName || 'کاربر'}</span>
            <span className="block text-[10px] text-slate-500">{user?.email}</span>
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
