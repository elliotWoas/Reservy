'use client';

import { useState, useEffect } from 'react';
import { Hairstyle } from '../types';
import { Sparkles, Loader2, AlertCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface TryOnLoadingStepProps {
  hairstyle: Hairstyle;
  error?: string | null;
  onRetry: () => void;
  onBack: () => void;
}

export function TryOnLoadingStep({ hairstyle, error, onRetry, onBack }: TryOnLoadingStepProps) {
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    'جداسازی ناحیه مو و حفظ ۱۰۰٪ ساختار چشم، بینی، لب و فک...',
    'محاسبه پرسپکتیو و هماهنگ‌سازی خط رویش مو با فرم صورت...',
    'ارسال تصویر به مدل هوش مصنوعی ادیت عکس و اجرای دستورات بافت مو...',
    'هماهنگ‌سازی کنتراست، سایه‌ها و استخراج خروجی نهایی با کیفیت بالا...',
  ];

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [error, stages.length]);

  return (
    <div className="w-full max-w-lg mx-auto p-8 rounded-3xl bg-[#111726] border border-amber-500/30 text-center space-y-6 shadow-2xl animate-in fade-in duration-400">
      {error ? (
        /* Error State */
        <div className="space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">خطا در پردازش تصویر با هوش مصنوعی</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>انتخاب مدل دیگر</span>
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تلاش مجدد</span>
            </button>
          </div>
        </div>
      ) : (
        /* Processing State */
        <div className="space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-amber-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              در حال اجرای پرو مجازی
            </span>
            <h3 className="text-xl font-black text-white">
              اعمال مدل موی «{hairstyle.persianName}»
            </h3>
            <p className="text-xs text-slate-400">
              ارسال به موتور هوش مصنوعی و ادیت عکس با حفظ کامل هویت چهره
            </p>
          </div>

          {/* Stepped progress indicators */}
          <div className="space-y-3 text-right max-w-sm mx-auto bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {stages.map((stageText, idx) => {
              const isPassed = idx < currentStage;
              const isCurrent = idx === currentStage;

              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  {isPassed ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px]">
                      ○
                    </span>
                  )}
                  <span
                    className={`${
                      isCurrent
                        ? 'text-white font-bold'
                        : isPassed
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {stageText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
