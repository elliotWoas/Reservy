'use client';

import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface ApiStatus {
  connected: boolean;
  provider: string;
  providerName: string;
  isDevMock: boolean;
  hasKey: boolean;
  keyPreview?: string;
  statusText: string;
  isStandardKey?: boolean;
}

export function ApiStatusBadge() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch('/api/hairstyle/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {
        setStatus({
          connected: false,
          provider: 'unknown',
          providerName: 'خطا در ارتباط با سرور',
          isDevMock: true,
          hasKey: false,
          statusText: 'عدم پاسخ‌دهی سرور وضعیت',
        });
      });
  }, []);

  if (!status) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        <span>بررسی اتصال API...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDetails((prev) => !prev)}
        className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
          status.hasKey
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
        }`}
        title="مشاهده جزییات اتصال هوش مصنوعی"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status.hasKey ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
          }`}
        />
        <span>{status.providerName}</span>
        <Info className="w-3 h-3 opacity-60" />
      </button>

      {showDetails && (
        <div className="absolute left-0 mt-2 w-72 p-4 rounded-2xl bg-[#111726] border border-amber-500/30 shadow-2xl text-xs space-y-2.5 z-50 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-white">وضعیت سرویس هوش مصنوعی</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                status.hasKey ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {status.hasKey ? 'کلید فعال' : 'حالت تست'}
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">{status.statusText}</p>

          {status.keyPreview && (
            <div className="bg-black/40 p-2 rounded-lg font-mono text-[11px] text-slate-400 flex justify-between">
              <span>پیش‌نمایش کلید:</span>
              <span className="text-amber-300">{status.keyPreview}</span>
            </div>
          )}

          {!status.isStandardKey && status.provider === 'gemini' && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed">
              💡 کلید با فرمت توکن است. برای دریافت کلید رسمی دائمی، از{' '}
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-white"
              >
                aistudio.google.com
              </a>{' '}
              اقدام فرمایید.
            </div>
          )}

          <div className="pt-1 text-[10px] text-slate-500 text-center border-t border-white/5">
            تست سریع ترمینال: <code className="text-slate-400">bun test:ai</code>
          </div>
        </div>
      )}
    </div>
  );
}
