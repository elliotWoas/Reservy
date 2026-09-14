'use client';

import { Camera, Sparkles, ShieldCheck, Check, Scissors, ArrowLeft } from 'lucide-react';

interface IntroStepProps {
  onStart: () => void;
  onQuickStart?: () => void;
}

export function IntroStep({ onStart, onQuickStart }: IntroStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>هوش مصنوعی پرو مجازی مدل مو و تحلیل فرم صورت</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          چه مدل مویی واقعاً به صورت من می‌آید؟
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          با بارگذاری یا ثبت ۱ عکس ساده، فرم صورت شما فوراً تحلیل شده و مناسب‌ترین مدل مو توسط هوش مصنوعی با حفظ کامل چهره روی شما پرو می‌شود. یا با اسکن ۳ زاویه‌ای تحلیل کامل ۳۶۰ درجه دریافت کنید.
        </p>
      </div>

      {/* 3 Photos Explanation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111726] border border-amber-500/20 space-y-3 text-center hover:border-amber-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
            ۱
          </div>
          <h3 className="font-bold text-white text-base">نمای روبرو</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            تصویر اصلی برای پرو نهایی مو، تحلیل تقارن چشم‌ها، پهنای استخوان گونه و فرم فک.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111726] border border-amber-500/20 space-y-3 text-center hover:border-amber-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
            ۲
          </div>
          <h3 className="font-bold text-white text-base">نیم‌رخ چپ</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            بررسی خط شقیقه، شیب پیشانی و بافت مو در نمای سه‌چهارم (چرخش ۳۰ تا ۴۵ درجه).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#111726] border border-amber-500/20 space-y-3 text-center hover:border-amber-500/50 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
            ۳
          </div>
          <h3 className="font-bold text-white text-base">نیم‌رخ راست</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            تأیید تقارن دو طرفه و تکمیل پروفایل هندسی استخوان‌بندی صورت شما.
          </p>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          <span>تضمین اصالت هویت و دقت پرو مجازی:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>حفظ ۱۰۰٪ فرم چشم‌ها، بینی، دهان، پوست و هویت شما</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>محاسبه ریاضی فرم صورت بر اساس اندازه‌گیری واقعی</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>پیشنهاد ۳ مدل موی برتر به همراه دلایل تناسب آرایشگری</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>ادیت تصویر واقعی توسط مدل هوش مصنوعی ادیت عکس AvalAI</span>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs leading-relaxed">
        <ShieldCheck className="w-6 h-6 flex-shrink-0 text-emerald-400" />
        <span>
          حفظ حریم خصوصی: تحلیل نقاط چهره به صورت محلی در مرورگر انجام شده و تنها برای استخراج ساختار هندسی استفاده می‌گردد.
        </span>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onQuickStart || onStart}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>⚡ پرو سریع با ۱ عکس (پیشنهاد و پرو آنی)</span>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onStart}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>اسکن ۳ مرحله‌ای کامل (۳۶۰ درجه)</span>
        </button>
      </div>
    </div>
  );
}
