'use client';

import { CaptureAngle, HeadPose, ImageQualityMetrics } from '../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface CameraOverlayProps {
  angle: CaptureAngle;
  pose?: HeadPose;
  quality?: ImageQualityMetrics;
  isCapturing?: boolean;
}

export function CameraOverlay({ angle, pose, quality, isCapturing }: CameraOverlayProps) {
  const getAngleTitle = () => {
    switch (angle) {
      case 'front':
        return 'نمای روبرو (مستقیم به لنز نگاه کنید)';
      case 'left':
        return 'نیم‌رخ چپ (سر را ۳۰ تا ۴۵ درجه به چپ بچرخانید)';
      case 'right':
        return 'نیم‌رخ راست (سر را ۳۰ تا ۴۵ درجه به راست بچرخانید)';
    }
  };

  const getPoseBadge = () => {
    if (!pose) return null;
    if (pose.angleStatus === 'valid') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>زاویه سر: ایده‌آل ({pose.yaw}°)</span>
        </div>
      );
    }
    if (pose.angleStatus === 'warning') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{pose.feedback}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
        <XCircle className="w-3.5 h-3.5" />
        <span>{pose.feedback}</span>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top Banner */}
      <div className="flex flex-col items-center gap-2">
        <div className="px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg">
          {getAngleTitle()}
        </div>
        {getPoseBadge()}
      </div>

      {/* Center Oval Guide */}
      <div className="relative flex-1 flex items-center justify-center">
        <div
          className={`relative w-[230px] h-[310px] sm:w-[270px] sm:h-[360px] rounded-[50%] border-2 transition-all duration-300 ${
            pose?.isValidForAngle
              ? 'border-emerald-400/80 shadow-[0_0_25px_rgba(52,211,153,0.35)]'
              : 'border-amber-400/60 border-dashed shadow-[0_0_20px_rgba(251,191,36,0.2)]'
          }`}
        >
          {/* Eye Level Guide Line */}
          <div className="absolute top-[38%] left-4 right-4 border-t border-white/25 flex justify-between text-[10px] text-white/50 px-1 -mt-3">
            <span>خط چشم</span>
            <span>Eye Line</span>
          </div>

          {/* Chin Guide Line */}
          <div className="absolute bottom-[8%] left-12 right-12 border-b border-white/20 text-center text-[10px] text-white/40 pb-0.5">
            خط چانه
          </div>

          {/* Crosshair Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-40">
            <div className="absolute top-1/2 left-0 right-0 border-t border-white" />
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-white" />
          </div>

          {/* Directional hint arrows for side angles */}
          {angle === 'left' && (
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-amber-400 animate-pulse text-2xl font-bold">
              ◀
            </div>
          )}
          {angle === 'right' && (
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-amber-400 animate-pulse text-2xl font-bold">
              ▶
            </div>
          )}
        </div>
      </div>

      {/* Bottom Quality Indicators */}
      {quality && (
        <div className="flex flex-wrap items-center justify-center gap-2 bg-black/60 backdrop-blur-sm p-2 rounded-2xl border border-white/10 text-[11px]">
          <span
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md ${
              quality.isBrightnessAcceptable ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
            }`}
          >
            نور: {quality.isBrightnessAcceptable ? 'مناسب' : 'نامناسب'}
          </span>
          <span
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md ${
              quality.isSharpnessAcceptable ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
            }`}
          >
            شفافیت: {quality.isSharpnessAcceptable ? 'واضح' : 'تار'}
          </span>
          <span
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md ${
              quality.isCentered ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
            }`}
          >
            موقعیت: {quality.isCentered ? 'در مرکز' : 'تنظیم شود'}
          </span>
        </div>
      )}
    </div>
  );
}
