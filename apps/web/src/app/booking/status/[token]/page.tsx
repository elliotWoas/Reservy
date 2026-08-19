'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  Upload,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate } from '@/lib/utils';

export default function BookingStatusPage({ params }: { params: { token: string } }) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [reUploadFile, setReUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        setLoading(true);
        const data = await ApiClient.request<any>(`/bookings/token/${params.token}`);
        setBooking(data);
      } catch (err: any) {
        setError(err.message || 'رزرو یافت نشد');
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [params.token]);

  const handleReUpload = async () => {
    if (!reUploadFile || !booking) return;
    try {
      setIsUploading(true);
      const uploaded = await ApiClient.uploadFile(reUploadFile);
      await ApiClient.request('/public/payments/proof', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking.id,
          fileUrl: uploaded.fileUrl,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.size,
          amount: booking.price,
        }),
      });
      // Refresh booking
      const refreshed = await ApiClient.request<any>(`/bookings/token/${params.token}`);
      setBooking(refreshed);
      setReUploadFile(null);
      alert('رسید جدید با موفقیت ارسال شد');
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال مجدد رسید');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xs font-semibold text-slate-500">در حال دریافت وضعیت نوبت...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 max-w-sm space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold text-slate-900">نوبت یافت نشد</h2>
          <p className="text-xs text-slate-500">{error || 'اطلاعات این نوبت در دسترس نیست'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6 selection:bg-emerald-500">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="text-xs font-semibold text-emerald-600">{booking.organization?.name}</span>
          <h1 className="text-xl font-black text-slate-900">پیگیری وضعیت نوبت</h1>
          <p className="text-xs text-slate-500">کد پیگیری: <span className="font-mono font-bold text-slate-800">{booking.code}</span></p>
        </div>

        {/* Status Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 text-right">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-xs text-slate-500">وضعیت فعلی نوبت:</span>
            <Badge status={booking.status} />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">خدمت:</span>
              <span className="font-bold text-slate-900">{booking.serviceNameSnapshot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ارائه‌دهنده:</span>
              <span className="font-bold text-slate-900">{booking.staffNameSnapshot || 'اولین فرد آزاد'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">زمان نوبت:</span>
              <span className="font-bold text-slate-900">{formatJalaliDate(booking.startAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">مبلغ:</span>
              <span className="font-black text-emerald-700">{formatToman(booking.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">نام مشتری:</span>
              <span className="font-bold text-slate-900">{booking.customer?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">شماره تماس:</span>
              <span className="font-bold text-slate-900" dir="ltr">{booking.customer?.phone}</span>
            </div>
          </div>

          {/* Rejection notice if rejected */}
          {booking.status === 'REJECTED' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-3">
              <p className="font-bold">رسید پرداخت شما رد شد:</p>
              <p>{booking.cancellationReason || 'لطفاً رسید صحیح و واضح را مجدداً آپلود فرمایید.'}</p>

              <div className="pt-2">
                <input
                  type="file"
                  onChange={(e) => setReUploadFile(e.target.files?.[0] || null)}
                  className="text-xs"
                />
                {reUploadFile && (
                  <Button
                    size="sm"
                    isLoading={isUploading}
                    onClick={handleReUpload}
                    className="mt-2 w-full"
                  >
                    ارسال مجدد رسید
                  </Button>
                )}
              </div>
            </div>
          )}

          {booking.status === 'CONFIRMED' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>پرداخت شما تایید شد و نوبت شما قطعی است. منتظر دیدار شما هستیم!</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href={`/${booking.organization?.slug}`}
            className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
          >
            بازگشت به صفحه اصلی کسب‌وکار
          </Link>
        </div>
      </div>
    </div>
  );
}
