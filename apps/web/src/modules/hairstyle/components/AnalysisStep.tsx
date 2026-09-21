'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  FaceGeometry,
  FaceShapeEstimate,
  FaceShapeType,
  HairDensity,
  HairLength,
  HairTexture,
  HairlineType,
  MaintenancePreference,
  StructuredUserProfile,
  StylePreference,
} from '../types';
import { Sparkles, Check, Sliders, ArrowLeft, Ruler, UserCheck } from 'lucide-react';

interface AnalysisStepProps {
  geometry: FaceGeometry;
  shapeEstimate: FaceShapeEstimate;
  onProceed: (data: {
    hair: {
      texture: HairTexture;
      density: HairDensity;
      length: HairLength;
      hairline: HairlineType;
    };
    preferences: {
      maintenance: MaintenancePreference;
      style: StylePreference;
    };
  }) => void;
}

export function AnalysisStep({ geometry, shapeEstimate, onProceed }: AnalysisStepProps) {
  // Hair inputs with smart defaults
  const [texture, setTexture] = useState<HairTexture>('wavy');
  const [density, setDensity] = useState<HairDensity>('medium');
  const [length, setLength] = useState<HairLength>('medium');
  const [hairline, setHairline] = useState<HairlineType>('normal');
  const [maintenance, setMaintenance] = useState<MaintenancePreference>('low');
  const [style, setStyle] = useState<StylePreference>('modern');

  const translateShape = (shape: FaceShapeType): string => {
    const map: Record<FaceShapeType, string> = {
      oval: 'بیضی (Oval)',
      round: 'گرد (Round)',
      square: 'مربعی (Square)',
      oblong: 'کشیده و مستطیلی (Oblong)',
      heart: 'مثلثی / قلبی (Heart)',
      diamond: 'لوزی (Diamond)',
    };
    return map[shape] || shape;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onProceed({
      hair: {
        texture,
        density,
        length,
        hairline,
      },
      preferences: {
        maintenance,
        style,
      },
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-400">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <UserCheck className="w-4 h-4" />
          <span>آنالیز هندسه چهره و ساختار استخوان‌بندی</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          نتایج اسکن و ویژگی‌های چهره شما
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          ابعاد دقیق و فرم تخمینی صورت شما از تصویر روبرو محاسبه شد. برای شخصی‌سازی نهایی پیشنهاد مدل مو، ویژگی‌های موی خود را مشخص فرمایید.
        </p>
      </div>

      {/* Face Shape & Proportions Card */}
      <div className="p-6 rounded-3xl bg-[#111726] border border-amber-500/30 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs text-slate-400">فرم استخوان‌بندی چهره شما:</span>
            <div className="text-2xl font-black text-amber-400 flex items-center gap-2 mt-1">
              <span>{translateShape(shapeEstimate.label)}</span>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>ضریب اطمینان: {Math.round(shapeEstimate.confidence * 100)}٪</span>
          </div>
        </div>

        {/* Calculated Anthropometric Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400">نسبت ابعادی (W/H)</span>
            <p className="text-base font-bold text-white mt-1">{geometry.aspectRatio}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400">عرض پیشانی</span>
            <p className="text-base font-bold text-white mt-1">{geometry.foreheadWidth}px</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400">فاصله گونه‌ها</span>
            <p className="text-base font-bold text-white mt-1">{geometry.cheekboneWidth}px</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400">عرض استخوان فک</span>
            <p className="text-base font-bold text-white mt-1">{geometry.jawWidth}px</p>
          </div>
        </div>
      </div>

      {/* Hair & Preferences Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-[#111726] border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>تکمیل اطلاعات جنس و ترجیحات موی شما</span>
        </div>

        {/* 1. Hair Texture */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">جنس و حالت طبیعی مو:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'straight', title: 'صاف (Straight)' },
              { id: 'wavy', title: 'موج‌دار (Wavy)' },
              { id: 'curly', title: 'فرفری (Curly)' },
              { id: 'coily', title: 'بسیار مجعد (Coily)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTexture(item.id as HairTexture)}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  texture === item.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Hair Density & Length */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">تراکم مو (پشتی مو):</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', title: 'کم‌پشت' },
                { id: 'medium', title: 'متوسط' },
                { id: 'high', title: 'پرپشت' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDensity(item.id as HairDensity)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    density === item.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">میزان نگهداری و حالت‌دهی روزانه:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', title: 'سریع و آسان' },
                { id: 'medium', title: 'معمولی' },
                { id: 'high', title: 'پر جزییات' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMaintenance(item.id as MaintenancePreference)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    maintenance === item.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Style Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">سبک استایل مورد علاقه شما:</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { id: 'modern', title: 'مدرن و ترند' },
              { id: 'classic', title: 'کلاسیک و رسمی' },
              { id: 'textured', title: 'خرد و بافت‌دار' },
              { id: 'clean', title: 'بسیار کوتاه و تمیز' },
              { id: 'trendy', title: 'خاص و اروپایی' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStyle(item.id as StylePreference)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  style === item.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 hover:scale-101 active:scale-99 transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>مشاهده ۳ مدل موی پیشنهادی متناسب با شما</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
