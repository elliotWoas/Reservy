'use client';

import { Hairstyle, TryOnResponsePayload } from '../types';
import { ComparisonSlider } from './ComparisonSlider';
import {
  Download,
  Scissors,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Share2,
  Info,
  Calendar,
} from 'lucide-react';

interface ResultStepProps {
  tryOnResult: TryOnResponsePayload;
  selectedHairstyle: Hairstyle;
  onTryAnother: () => void;
  onRestart: () => void;
}

export function ResultStep({
  tryOnResult,
  selectedHairstyle,
  onTryAnother,
  onRestart,
}: ResultStepProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = tryOnResult.imageUrl || tryOnResult.generatedImageUrl;
    link.download = `reservy-hairstyle-${selectedHairstyle.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>پرو مجازی با موفقیت تولید شد</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          نتیجه پرو موی «{selectedHairstyle.persianName}»
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          تصویر چهره واقعی شما با مدل موی جدید. هویت و فرم استخوان‌بندی صورت شما کاملاً حفظ شده است.
        </p>
      </div>

      {/* Dev Mock Diagnostic Notice if active */}
      {tryOnResult.isDevMock && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs leading-relaxed">
          <Info className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-300">توجه توسعه‌دهنده (حالت Dev Mock):</strong>
            <p className="mt-1 text-slate-300">
              این نتیجه در حالت آفلاین/توسعه تولید شده است. برای دریافت تصاویر ویرایش‌شده با مدل‌های زنده، کلید{' '}
              <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">REPLICATE_API_TOKEN</code> یا{' '}
              <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">OPENAI_API_KEY</code> را در فایل{' '}
              <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">.env</code> تنظیم فرمایید.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Before / After Comparison Slider */}
      <ComparisonSlider
        originalImage={tryOnResult.originalImageUrl}
        generatedImage={tryOnResult.imageUrl || tryOnResult.generatedImageUrl}
        hairstyleName={tryOnResult.hairStyle || selectedHairstyle.name}
        persianName={selectedHairstyle.persianName}
      />

      {/* Barber Technical Card */}
      <div className="p-6 rounded-3xl bg-[#111726] border border-amber-500/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>کارت مشخصات فنی جهت ارائه به آرایشگر (Barber Card)</span>
          </div>
          <span className="text-[11px] text-amber-400 font-mono">
            {selectedHairstyle.name}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {selectedHairstyle.barberNotes}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px]">طول موی بالای سر:</span>
            <p className="font-bold text-white mt-1">{selectedHairstyle.topLength}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px]">فید و دور سر:</span>
            <p className="font-bold text-white mt-1">{selectedHairstyle.sides}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px]">چتری و لبه جلو:</span>
            <p className="font-bold text-white mt-1">{selectedHairstyle.fringe}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px]">مواد پیشنهادی:</span>
            <p className="font-bold text-white mt-1">{selectedHairstyle.finish}</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onTryAnother}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
          >
            <Scissors className="w-4 h-4" />
            <span>تست ۲ مدل پیشنهادی دیگر</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>عکاسی مجدد</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 hover:scale-102 active:scale-98 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>دانلود تصویر نهایی</span>
        </button>
      </div>
    </div>
  );
}
