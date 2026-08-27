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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-[#0E131F]/80 backdrop-blur-xl border-b border-amber-500/10 text-right shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 text-xs font-bold text-amber-300 border border-amber-500/20">
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>{organization?.name || 'کسب‌وکار من'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.fullName || 'کاربر'} size="sm" />
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-extrabold text-white">{user?.fullName || 'مدیریت'}</span>
            <span className="block text-[10px] text-slate-400 font-medium">{user?.email}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="خروج از حساب"
          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
