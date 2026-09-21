'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  X,
  LogOut,
  Building2,
  Pin,
  PinOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiClient } from '@/lib/api-client';
import { Avatar } from '@/components/ui/Avatar';

interface DashboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  organization?: any;
  isSuperAdmin?: boolean;
  isDesktopPinned?: boolean;
  onTogglePin?: () => void;
}

export function DashboardDrawer({
  isOpen,
  onClose,
  user,
  organization,
  isSuperAdmin,
  isDesktopPinned,
  onTogglePin,
}: DashboardDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    onClose();
    ApiClient.removeToken();
    router.push('/login');
  };

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
    <>
      {/* Backdrop Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/70 backdrop-blur-xs transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer Panel */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 right-0 z-50 w-72 sm:w-80 bg-[#0E131F]/98 backdrop-blur-2xl border-l border-amber-500/20 shadow-[-12px_0_50px_rgba(0,0,0,0.85)] flex flex-col text-right select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        dir="rtl"
        aria-label="منوی کشویی"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-amber-500/15 flex items-center justify-between bg-black/20">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-slate-950 font-black text-lg shadow-luxury-sm">
              R
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-sm text-white tracking-tight">رزِروی</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="block text-[9px] text-amber-400/80 font-bold">پلتفرم مدیریت رزرو هوشمند</span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Desktop Pin Toggle (hidden on mobile) */}
            {onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                title={isDesktopPinned ? 'حالت شناور (عدم سنجاق)' : 'سنجاق کردن سایدبار به صفحه'}
                className="hidden lg:flex p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-amber-500/10 transition-colors"
              >
                {isDesktopPinned ? <Pin className="w-4 h-4 text-amber-400" /> : <PinOff className="w-4 h-4" />}
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="بستن منو"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User & Organization Brief Card */}
        <div className="p-4 mx-3 my-2 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.fullName || 'کاربر'} size="sm" />
            <div className="min-w-0 text-right">
              <span className="block text-xs font-bold text-white truncate">{user?.fullName || 'مدیریت'}</span>
              <span className="block text-[10px] text-slate-400 truncate">{user?.email}</span>
            </div>
          </div>
          {organization?.name && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-[10px] font-bold text-amber-300 border border-amber-500/20 whitespace-nowrap">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span className="truncate max-w-[80px]">{organization.name}</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150',
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
            <div className="pt-3 mt-3 border-t border-amber-500/10">
              <Link
                href="/admin"
                onClick={onClose}
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

        {/* Drawer Footer Actions */}
        <div className="p-3 border-t border-amber-500/15 space-y-2 bg-black/20">
          {organization?.slug && (
            <Link
              href={`/${organization.slug}`}
              target="_blank"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-xs font-bold text-slate-300 hover:text-amber-300 transition-all border border-amber-500/20 group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>صفحه رزرو مشتریان</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/40 text-amber-400/80 font-mono">
                /{organization.slug}
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/15 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>
    </>
  );
}
