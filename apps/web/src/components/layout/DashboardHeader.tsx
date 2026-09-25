'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Building2, Menu, ExternalLink } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { Avatar } from '@/components/ui/Avatar';

interface DashboardHeaderProps {
  user?: any;
  organization?: any;
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
}

export function DashboardHeader({
  user,
  organization,
  onToggleMenu,
  isMenuOpen,
}: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    ApiClient.removeToken();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-[#0E131F]/90 backdrop-blur-xl border-b border-amber-500/10 text-right shadow-lg">
      {/* Right Side (Start in RTL): Hamburger Menu Button + User Identity */}
      <div className="flex items-center gap-3">
        {onToggleMenu && (
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label="منوی اصلی"
            title="منوی اصلی (کشویی)"
            className="p-2 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-500/30 transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs group"
          >
            <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <Avatar name={user?.fullName || 'کاربر'} size="sm" />
          <div className="hidden sm:block text-right">
            <span className="block text-xs font-extrabold text-white leading-tight">{user?.fullName || 'مدیریت'}</span>
            <span className="block text-[10px] text-slate-400 font-medium leading-tight">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Center: Active Organization Badge */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/10 text-xs font-bold text-amber-300 border border-amber-500/20 shadow-xs">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate max-w-[140px] sm:max-w-[220px]">{organization?.name || 'کسب‌وکار من'}</span>
        </div>
      </div>

      {/* Left Side (End in RTL): Storefront Shortcut & Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {organization?.slug && (
          <Link
            href={`/${organization.slug}`}
            target="_blank"
            title="مشاهده صفحه رزرو مشتریان"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 text-xs font-bold border border-white/10 hover:border-amber-500/20 transition-all shadow-xs group"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>صفحه عمومی</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="خروج از حساب"
          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
