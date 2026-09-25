import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HairstyleWizard, ApiStatusBadge } from '@/modules/hairstyle';

export const metadata: Metadata = {
  title: 'پرو مجازی مدل مو با هوش مصنوعی | رزِروی',
  description: 'آنالیز فرم چهره و پرو مجازی مدل مو با هوش مصنوعی متناسب با خط فک، پیشانی و نوع مو',
};

export default function HairstylePage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="border-b border-amber-500/15 bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به رزِروی</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
              R
            </div>
            <span className="text-sm font-black text-white tracking-tight hidden sm:inline">
              رزِروی | Hairstyle AI
            </span>
          </div>

          <ApiStatusBadge />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <HairstyleWizard />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        پرو مجازی مدل مو رزِروی — کلیه حقوق محفوظ است © ۱۴۰۳
      </footer>
    </div>
  );
}
