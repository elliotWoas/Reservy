'use client';

import { Hairstyle } from '../types';
import { Sparkles, Check, Scissors, ArrowLeft, ArrowRight, Clock, Star } from 'lucide-react';

interface RecommendationStepProps {
  recommendations: Hairstyle[];
  onSelectHairstyle: (hairstyle: Hairstyle) => void;
  onBack: () => void;
}

export function RecommendationStep({
  recommendations,
  onSelectHairstyle,
  onBack,
}: RecommendationStepProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-400">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>تغییر مشخصات</span>
        </button>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          ۳ پیشنهاد اختصاصی هوش مصنوعی
        </span>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          بهترین مدل‌های مو متناسب با فرم چهره شما
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          مدل مورد نظر خود را انتخاب فرمایید تا مدل هوش مصنوعی ادیت تصویر، این مدل مو را دقیقاً روی عکس واقعی شما اعمال کند.
        </p>
      </div>

      {/* 3 Recommendations Cards */}
      <div className="space-y-4">
        {recommendations.map((item, index) => {
          const isTopRank = index === 0;

          return (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                isTopRank
                  ? 'bg-gradient-to-b from-[#151D30] to-[#0E1424] border-amber-500/40 shadow-2xl shadow-amber-500/10'
                  : 'bg-[#111726] border-slate-800 hover:border-amber-500/30 shadow-xl'
              }`}
            >
              {isTopRank && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-400 text-slate-950 font-black text-[11px] px-4 py-1 rounded-bl-2xl shadow-md flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>بیشترین سازگاری با چهره شما</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-black text-white">{item.persianName}</h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">{item.name}</p>
                </div>

                {/* Match Score Badge */}
                <div className="px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-sm flex items-center gap-1.5 shadow-inner">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{item.matchScore}٪ تطابق فرمی</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                {item.description}
              </p>

              {/* "Why" Reasons Bullets */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>علت پیشنهاد به شما:</span>
                </span>
                <ul className="space-y-1.5">
                  {item.matchReasons.map((reason, rIndex) => (
                    <li key={rIndex} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hairstyle Structured Attributes Tags */}
              <div className="flex flex-wrap gap-2 mt-4 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  قد بالا: <strong className="text-white">{item.topLength}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  دور سر: <strong className="text-white">{item.sides}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  فینیش: <strong className="text-white">{item.finish}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  نگهداری روزانه: <strong className="text-white">{item.maintenance === 'low' ? 'آسان' : item.maintenance === 'medium' ? 'متوسط' : 'پرکار'}</strong>
                </span>
              </div>

              {/* Select & Try-On Action Button */}
              <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectHairstyle(item)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>انتخاب و پرو مجازی این مدل</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
