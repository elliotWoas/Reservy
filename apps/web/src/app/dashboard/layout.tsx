'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ApiClient } from '@/lib/api-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">در حال بارگذاری داشبورد...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-emerald-500" dir="rtl">
      {/* Right Desktop Sidebar */}
      <DashboardSidebar
        orgSlug={user?.activeOrganization?.slug}
        isSuperAdmin={user?.isSuperAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <DashboardHeader user={user} organization={user?.activeOrganization} />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
