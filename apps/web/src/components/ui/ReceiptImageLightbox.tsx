'use client';

import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, ShieldCheck, CreditCard } from 'lucide-react';
import { formatToman, formatJalaliDate, formatTimeFa } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ReceiptImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  amount?: number;
  customerName?: string;
  referenceNumber?: string | null;
  uploadedAt?: string | Date;
  status?: string;
}

export function ReceiptImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  amount,
  customerName,
  referenceNumber,
  uploadedAt,
  status = 'PROOF_SUBMITTED',
}: ReceiptImageLightboxProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isRendered, setIsRendered] = useState<boolean>(isOpen);
  const [animationClass, setAnimationClass] = useState<string>('scale-95 opacity-0');

  // Smooth entrance & exit animations
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setZoomLevel(1);
      // Small timeout to allow DOM mounting before trigger transition
      const timer = setTimeout(() => {
        setAnimationClass('scale-100 opacity-100');
      }, 20);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setAnimationClass('scale-95 opacity-0');
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 250);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.3, 0.8));
  };

  // Build full backend URL for relative storage paths
  const resolvedImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      dir="rtl"
      onClick={onClose}
    >
      {/* Lightbox Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/40 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[92vh] transform transition-all duration-300 ease-out ${animationClass}`}
      >
        {/* Top Luxury Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700/60 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight">تصویر رسید پرداخت کارت‌به‌کارت</h3>
                <Badge status={status} />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مشتری: <span className="text-slate-200 font-semibold">{customerName || 'مشتری'}</span>
                {amount ? ` • مبلغ: ${formatToman(amount)}` : ''}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
              title="بزرگ‌نمایی (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
              title="کوچک‌نمایی (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <a
              href={resolvedImageUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
              title="دانلود فایل اصلی یا باز کردن در تب جدید"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white transition-colors ml-1"
              title="بستن (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High-Resolution Interactive Image Viewport */}
        <div className="relative flex-1 min-h-[350px] max-h-[65vh] bg-slate-950/90 flex items-center justify-center p-4 overflow-auto cursor-zoom-in">
          <img
            src={resolvedImageUrl}
            alt={`رسید پرداخت ${customerName || ''}`}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200 ease-out origin-center"
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel((prev) => (prev === 1 ? 1.6 : 1));
            }}
          />
        </div>

        {/* Bottom Receipt Metadata Details */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 flex-wrap">
            {referenceNumber && (
              <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                شماره پیگیری: <strong className="text-slate-900 dark:text-white">{referenceNumber}</strong>
              </span>
            )}
            {uploadedAt && (
              <span>
                تاریخ ثبت رسید: <strong className="text-slate-800 dark:text-slate-200">{formatJalaliDate(uploadedAt)}</strong> ساعت{' '}
                <strong className="text-slate-800 dark:text-slate-200">{formatTimeFa(uploadedAt)}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">برای بزرگ‌نمایی روی تصویر کلیک کنید</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
