'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardDrawer } from '@/components/layout/DashboardDrawer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ApiClient } from '@/lib/api-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDesktopPinned, setIsDesktopPinned] = useState<boolean>(true);

  // Restore desktop sidebar preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('reservy_desktop_sidebar_pinned');
      if (saved !== null) {
        setIsDesktopPinned(saved === 'true');
      }
    } catch (e) {
      // Ignore localStorage error in SSR
    }
  }, []);

  // Close sliding drawer on route navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const toggleDesktopPinned = () => {
    setIsDesktopPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('reservy_desktop_sidebar_pinned', String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleToggleMenu = () => {
    // If desktop sidebar is currently pinned, clicking hamburger collapses it for full-screen mode
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && isDesktopPinned) {
      toggleDesktopPinned();
    } else {
      // Otherwise open/toggle sliding drawer (on mobile or unpinned desktop)
      setIsDrawerOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    async function loadMe() {
      try {
        setLoading(true);
        const data = await ApiClient.request<any>('/auth/me');
        setUser(data);
        if (data.activeOrganization?.id) {
          ApiClient.setActiveOrgId(data.activeOrganization.id);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F17]">
        <div className="flex flex-col items-center gap-3.5">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin shadow-luxury-sm" />
          <span className="text-xs font-bold text-slate-400">در حال بارگذاری داشبورد...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0B0F17] text-slate-100 selection:bg-amber-500 selection:text-black" dir="rtl">
      {/* Right Desktop Sidebar (Collapsible / Pinnable) */}
      <DashboardSidebar
        orgSlug={user?.activeOrganization?.slug}
        isSuperAdmin={user?.isSuperAdmin}
        isPinned={isDesktopPinned}
        onTogglePin={toggleDesktopPinned}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 transition-all duration-300">
        <DashboardHeader
          user={user}
          organization={user?.activeOrganization}
          onToggleMenu={handleToggleMenu}
          isMenuOpen={isDrawerOpen}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Sliding Navigation Drawer (Mobile & Desktop) */}
      <DashboardDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        organization={user?.activeOrganization}
        isSuperAdmin={user?.isSuperAdmin}
        isDesktopPinned={isDesktopPinned}
        onTogglePin={() => {
          toggleDesktopPinned();
          setIsDrawerOpen(false);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
