import Link from 'next/link';
import {
  Calendar,
  CreditCard,
  Users,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  LayoutDashboard,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white selection:bg-emerald-500">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              R
            </div>
            <span className="text-xl font-black tracking-tight text-white">رزِروی (Reservy)</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              ورود به پنل مدیریت
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              ثبت‌نام کسب‌وکار
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-24 pb-20 px-6 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>پلتفرم مدرن نوبت‌دهی آنلاین و مدیریت رزرواسیون</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.2] text-white">
              مدیریت هوشمند نوبت‌ها،
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-200">
                دریافت آنلاین و تسویه کارت‌به‌کارت
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              راهکار جامع برای سالن‌های زیبایی، کلینیک‌ها، پزشکان، مشاوران، مربیان و تمامی کسب‌وکارهای خدمت‌محور با پشتیبانی کامل از پرداخت کارت‌به‌کارت، تقویم جلالی و سیستم CRM.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/aria-beauty"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>مشاهده صفحه رزرو دمو (آریا بیوتی)</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all hover:border-slate-600"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>ورود به داشبورد دمو</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-slate-950/50 border-t border-slate-800/80 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-2xl sm:text-3xl font-black text-white">امکانات پلتفرم رزِروی</h2>
              <p className="text-xs sm:text-sm text-slate-400">طراحی شده برای حداکثر بهره‌وری و تجربه کاربری بی‌نقص</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">موتور پیشرفته دسترسی‌پذیری</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تولید دقیق سانس‌های آزاد با احتساب ساعات کاری، زمان‌های استراحت، مرخصی‌ها، بافرهای قبل و بعد خدمت و جلوگیری قطعی از تداخل رزروها.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">پرداخت کارت‌به‌کارت امن</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  نمایش شماره کارت و نام صاحب حساب به مشتری، آپلود تصویر رسید بانکی با اعتبارسنجی امن سرور، و تایید نهایی توسط مدیر کسب‌وکار.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">سیستم مدیریت مشتریان (CRM)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ثبت پرونده مشتریان، شمارش مراجعات، مجموع دریافتی‌ها، تاریخ آخرین نوبت و ثبت یادداشت‌های محرمانه برای هر مشتری.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>رزِروی (Reservy) — پلتفرم رزرو آنلاین چندمستأجره با معماری تمیز و مقیاس‌پذیر</p>
      </footer>
    </div>
  );
}
