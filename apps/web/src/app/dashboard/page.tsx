'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Scissors,
  Phone,
  Eye,
  Check,
  X,
  User,
  ExternalLink,
  MessageSquare,
  FileImage,
  ZoomIn,
  ShieldCheck,
  Sparkles,
  Flame,
  CalendarDays,
  Receipt,
  CheckCheck,
  Ban,
} from 'lucide-react';
import { StatCard, Card, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { ReceiptImageLightbox } from '@/components/ui/ReceiptImageLightbox';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatTimeFa, formatNumberFa } from '@/lib/utils';

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    amount?: number;
    customerName?: string;
    referenceNumber?: string | null;
    uploadedAt?: string;
    status?: string;
  }>({
    isOpen: false,
    imageUrl: '',
  });

  // Load summary statistics and prioritized bookings
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.request<any>('/reporting/summary');
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Status Update Handler: Complete, Confirm, Cancel, Reject
  const handleQuickStatusUpdate = async (bookingId: string, newStatus: string, reason?: string) => {
    try {
      setIsUpdating(true);
      const payload: any = { status: newStatus };
      if (reason) payload.cancellationReason = reason;

      await ApiClient.request(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setSelectedBooking(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت نوبت');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <div className="text-center space-y-3.5">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-luxury-md" />
          <p className="text-xs text-slate-400 font-bold">در حال بارگذاری پیشخوان هوشمند و لوکس...</p>
        </div>
      </div>
    );
  }

  const metrics = summary?.metrics || {};
  const upcomingToday = summary?.upcomingToday || [];
  const upcomingTomorrow = summary?.upcomingTomorrow || [];
  const recentPendingPayments = summary?.recentPendingPayments || [];
  const recentBookings = summary?.recentBookings || [];

  return (
    <div className="space-y-8 animate-fade-in text-right">
      {/* ---------------------------------------------------- */}
      {/* 1. Header with Luxury Gold Accent & Action Buttons   */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#172033] via-[#111726] to-[#172033] p-6 rounded-3xl border border-amber-500/20 shadow-luxury-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">پیشخوان مدیریت نوبت‌ها و فاکتورها</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                اولویت‌بندی روزانه نوبت‌ها، بررسی فیش‌های واریزی و ثبت وضعیت اتمام خدمت
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/dashboard/calendar">
            <Button size="sm" variant="goldOutline" className="flex items-center gap-1.5 rounded-2xl">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>مشاهده تقویم</span>
            </Button>
          </Link>
          <Link href="/dashboard/bookings">
            <Button size="sm" variant="goldOutline" className="flex items-center gap-1.5 rounded-2xl">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>تمام فاکتورها</span>
            </Button>
          </Link>
          <Link href="/dashboard/calendar?new=1">
            <Button size="sm" variant="gold" className="flex items-center gap-1.5 rounded-2xl shadow-luxury-sm">
              <Plus className="w-4 h-4" />
              <span>ثبت نوبت دستی</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. Top Luxury Metrics Overview                      */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="نوبت‌های امروز"
          value={formatNumberFa(metrics.bookingsToday || 0)}
          icon={Flame}
          subtitle={`${formatNumberFa(metrics.confirmedToday || 0)} نوبت تایید شده`}
        />
        <StatCard
          title="نوبت‌های فردا"
          value={formatNumberFa(metrics.bookingsTomorrow || 0)}
          icon={CalendarDays}
          subtitle="رزروهای برنامه‌ریزی شده فردا"
        />
        <StatCard
          title="فیش‌های در انتظار تایید"
          value={formatNumberFa(metrics.pendingProofsCount || 0)}
          icon={CreditCard}
          subtitle="رسیدهای کارت‌به‌کارت معوقه"
          className={metrics.pendingProofsCount > 0 ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''}
        />
        <StatCard
          title="درآمد امروز"
          value={formatToman(metrics.revenueToday || 0)}
          icon={TrendingUp}
          subtitle={`درآمد این ماه: ${formatToman(metrics.revenueMonth || 0)}`}
        />
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. Priority 1: TODAY'S APPOINTMENTS (مهم‌ترین اولویت) */}
      {/* ---------------------------------------------------- */}
      <Card className="space-y-4 p-6 border-amber-500/25 bg-gradient-to-b from-[#141B2D] to-[#0E131F] shadow-luxury-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center shadow-xs font-black">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">اولویت اول: نوبت‌های امروز ({formatNumberFa(upcomingToday.length)})</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  اقدام فوری
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                پس از انجام کار، روی «اصلاح انجام شد» کلیک کنید تا فاکتور تکمیل و بسته شود.
              </p>
            </div>
          </div>
        </div>

        {upcomingToday.length === 0 ? (
          <EmptyState
            title="برای امروز نوبتی ثبت نشده است"
            description="نوبت‌های ثبت شده برای امروز در این بخش با اولویت اول نمایش داده می‌شوند."
            icon={Calendar}
          />
        ) : (
          <div className="space-y-3.5">
            {upcomingToday.map((booking: any) => {
              const proof = booking.payments?.[0]?.proofs?.[0];
              const isCompleted = booking.status === 'COMPLETED';
              const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';

              return (
                <div
                  key={booking.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : isCancelled
                      ? 'border-slate-800 bg-slate-900/40 opacity-60'
                      : 'border-amber-500/20 bg-[#111726] hover:border-amber-500/40 hover:bg-[#161D2E] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {/* Customer & Booking Details */}
                  <div className="flex items-start gap-4">
                    <Avatar name={booking.customer?.fullName || 'مشتری'} size="lg" />

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-black text-white">
                          {booking.customer?.fullName || 'مشتری بدون نام'}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          {booking.code}
                        </span>
                        <Badge status={booking.status} />

                        {proof && (
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxData({
                                isOpen: true,
                                imageUrl: proof.fileUrl,
                                amount: booking.priceSnapshot,
                                customerName: booking.customer?.fullName,
                                referenceNumber: booking.payments?.[0]?.referenceNumber,
                                uploadedAt: proof.uploadedAt,
                                status: booking.status,
                              })
                            }
                            className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileImage className="w-3 h-3 text-amber-400" />
                            <span>مشاهده فیش</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-amber-300">{booking.service?.name || booking.serviceNameSnapshot}</span>
                        <span className="text-slate-600">•</span>
                        <span>ارائه‌دهنده: {booking.staff?.displayName || booking.staffNameSnapshot || 'ارائه‌دهنده'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-black text-white">{formatToman(booking.priceSnapshot || booking.price || 0)}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-amber-300/90">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          ساعت {formatTimeFa(booking.startAt)} ({booking.durationSnapshot || booking.service?.durationMinutes || 45} دقیقه)
                        </span>
                        <a
                          href={`tel:${booking.customer?.phone}`}
                          className="font-mono text-emerald-400 font-bold hover:underline flex items-center gap-1"
                          dir="ltr"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{booking.customer?.phone}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Barber Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 flex-wrap justify-end">
                    {/* 1. Confirm Receipt & Booking */}
                    {booking.status === 'PENDING_PAYMENT' || booking.status === 'PAYMENT_SUBMITTED' ? (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickStatusUpdate(booking.id, 'CONFIRMED')}
                        className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-luxury-sm transition-colors cursor-pointer"
                        title="تایید فیش و نوبت"
                      >
                        <Check className="w-4 h-4" />
                        <span>تایید فیش و نوبت</span>
                      </button>
                    ) : null}

                    {/* 2. Complete Haircut / Service (بستن فاکتور) */}
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickStatusUpdate(booking.id, 'COMPLETED')}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-luxury-sm transition-all cursor-pointer"
                        title="اصلاح انجام شد و فاکتور بسته شود"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>اصلاح انجام شد (بستن فاکتور)</span>
                      </button>
                    )}

                    {/* 3. Cancel / Reject Button */}
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          if (confirm(`آیا از لغو نوبت ${booking.customer?.fullName} اطمینان دارید؟`)) {
                            handleQuickStatusUpdate(booking.id, 'CANCELLED', 'لغو توسط آرایشگر');
                          }
                        }}
                        className="px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1 border border-rose-500/30 transition-colors cursor-pointer"
                        title="لغو یا رد نوبت"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>لغو نوبت</span>
                      </button>
                    )}

                    {/* 4. Details / Receipt Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>رسید و فاکتور</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* 4. Priority 2: TOMORROW'S APPOINTMENTS (اولویت فردا) */}
      {/* ---------------------------------------------------- */}
      <Card className="space-y-4 p-6 border-amber-500/15 bg-[#111726]/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center shadow-xs border border-slate-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">اولویت دوم: نوبت‌های فردا ({formatNumberFa(upcomingTomorrow.length)})</h2>
              <p className="text-xs text-slate-400 mt-0.5">آمادگی و بررسی نوبت‌ها و رزروهای ثبت شده برای فردا</p>
            </div>
          </div>
        </div>

        {upcomingTomorrow.length === 0 ? (
          <EmptyState
            title="برای فردا نوبتی ثبت نشده است"
            description="نوبت‌های ثبت شده برای فردا در این بخش قرار می‌گیرند."
            icon={CalendarDays}
          />
        ) : (
          <div className="space-y-3.5">
            {upcomingTomorrow.map((booking: any) => {
              return (
                <div
                  key={booking.id}
                  className="p-4.5 rounded-3xl bg-[#0E131F] hover:bg-[#141B2D] border border-amber-500/10 hover:border-amber-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar name={booking.customer?.fullName || 'مشتری'} size="md" />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{booking.customer?.fullName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-amber-300 border border-amber-500/20">
                          {booking.code}
                        </span>
                        <Badge status={booking.status} />
                      </div>

                      <p className="text-xs text-slate-300">
                        {booking.service?.name} با {booking.staff?.displayName || 'ارائه‌دهنده'}
                      </p>

                      <div className="flex items-center gap-3.5 text-xs text-slate-400">
                        <span className="font-bold text-amber-300">
                          فردا ساعت {formatTimeFa(booking.startAt)} ({booking.durationSnapshot || 45} دقیقه)
                        </span>
                        <a href={`tel:${booking.customer?.phone}`} className="font-mono text-emerald-400 font-bold hover:underline" dir="ltr">
                          {booking.customer?.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    {booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickStatusUpdate(booking.id, 'CONFIRMED')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        تایید نوبت
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/5 cursor-pointer"
                    >
                      رسید و فاکتور
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* 5. Priority 3: SENT RECEIPTS AWAITING CONFIRMATION  */}
      {/* ---------------------------------------------------- */}
      <Card className="space-y-4 p-6 border-amber-500/20 bg-[#111726]/90 shadow-luxury-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                تمام فیش‌ها و رسیدهای ارسالی در انتظار تایید ({formatNumberFa(recentPendingPayments.length)})
              </h3>
              <p className="text-[11px] text-slate-400">رسیدهای کارت‌به‌کارت آپلود شده توسط مشتریان</p>
            </div>
          </div>
          <Link href="/dashboard/payments" className="text-xs font-bold text-amber-400 hover:underline">
            مشاهده در بخش پرداخت‌ها
          </Link>
        </div>

        {recentPendingPayments.length === 0 ? (
          <EmptyState
            title="هیچ فیش معوقه‌ای وجود ندارد"
            description="تمامی فیش‌های ارسالی مشتریان بررسی و تایید شده‌اند."
            icon={CheckCircle2}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentPendingPayments.map((payment: any) => {
              const proof = payment.proofs?.[0];
              return (
                <div
                  key={payment.id}
                  className="p-4 rounded-2xl bg-[#0E131F] border border-amber-500/20 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{payment.booking?.customer?.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{payment.booking?.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{payment.booking?.service?.name}</p>
                    <span className="text-xs font-black text-amber-400 block">{formatToman(payment.amount)}</span>
                  </div>

                  <div className="space-y-1.5 text-left">
                    {proof?.fileUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxData({
                            isOpen: true,
                            imageUrl: proof.fileUrl,
                            amount: payment.amount,
                            customerName: payment.booking?.customer?.fullName,
                            referenceNumber: payment.referenceNumber,
                            uploadedAt: proof.uploadedAt,
                            status: payment.status,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow-luxury-sm"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>مشاهده فیش</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* 6. Comprehensive Digital Receipt & Invoice Modal     */}
      {/* ---------------------------------------------------- */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title="رسید رسمی و فاکتور نوبت"
          maxWidth="lg"
        >
          <div className="space-y-6 text-right">
            {/* Customer Profile Header */}
            <div className="p-4.5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#111726] to-amber-500/10 border border-amber-500/20 flex items-center gap-4">
              <Avatar name={selectedBooking.customer?.fullName || 'مشتری'} size="xl" />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white">
                    {selectedBooking.customer?.fullName || 'مشتری بدون نام'}
                  </h3>
                  <Badge status={selectedBooking.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <a
                    href={`tel:${selectedBooking.customer?.phone}`}
                    className="flex items-center gap-1 font-mono text-emerald-400 font-bold hover:underline"
                    dir="ltr"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedBooking.customer?.phone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Payment Proof Section */}
            {(() => {
              const proof = selectedBooking.payments?.[0]?.proofs?.[0];
              const payment = selectedBooking.payments?.[0];
              const fileUrl = proof?.fileUrl;

              if (fileUrl) {
                const resolvedFileUrl = fileUrl.startsWith('http')
                  ? fileUrl
                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;

                return (
                  <div className="p-4 rounded-3xl bg-[#0E131F] border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        تصویر رسید فیش واریزی کارت‌به‌کارت
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxData({
                            isOpen: true,
                            imageUrl: fileUrl,
                            amount: payment?.amount || selectedBooking.priceSnapshot,
                            customerName: selectedBooking.customer?.fullName,
                            referenceNumber: payment?.referenceNumber,
                            uploadedAt: proof.uploadedAt,
                            status: payment?.status || selectedBooking.status,
                          })
                        }
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>بزرگ‌نمایی با انیمیشن</span>
                      </button>
                    </div>

                    <div
                      onClick={() =>
                        setLightboxData({
                          isOpen: true,
                          imageUrl: fileUrl,
                          amount: payment?.amount || selectedBooking.priceSnapshot,
                          customerName: selectedBooking.customer?.fullName,
                          referenceNumber: payment?.referenceNumber,
                          uploadedAt: proof.uploadedAt,
                          status: payment?.status || selectedBooking.status,
                        })
                      }
                      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-500/40 bg-black flex items-center justify-center max-h-48 shadow-lg"
                    >
                      <img
                        src={resolvedFileUrl}
                        alt="رسید پرداخت"
                        className="max-h-48 w-auto object-contain opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-xs">
                        <ZoomIn className="w-4 h-4" />
                        <span>جهت بزرگ‌نمایی کلیک کنید</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="p-3.5 rounded-2xl bg-[#0E131F] border border-amber-500/15 text-xs text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    پرداخت حضوری / در محل
                  </span>
                  <span className="font-bold text-amber-400 font-mono">
                    {formatToman(selectedBooking.priceSnapshot || selectedBooking.price || 0)}
                  </span>
                </div>
              );
            })()}

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#0E131F] border border-amber-500/15 space-y-1">
                <span className="text-slate-400 text-[11px] block">کد رهگیری فاکتور</span>
                <span className="font-mono font-bold text-white text-sm">{selectedBooking.code}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E131F] border border-amber-500/15 space-y-1">
                <span className="text-slate-400 text-[11px] block">مبلغ کل فاکتور</span>
                <span className="font-black text-amber-400 text-sm">
                  {formatToman(selectedBooking.priceSnapshot || selectedBooking.price || 0)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E131F] border border-amber-500/15 space-y-1">
                <span className="text-slate-400 text-[11px] block">تاریخ نوبت</span>
                <span className="font-bold text-white">{formatJalaliDate(selectedBooking.startAt)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E131F] border border-amber-500/15 space-y-1">
                <span className="text-slate-400 text-[11px] block">ساعت نوبت</span>
                <span className="font-bold text-white">{formatTimeFa(selectedBooking.startAt)}</span>
              </div>
            </div>

            {/* Modal Decision Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <a
                href={`tel:${selectedBooking.customer?.phone}`}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/5"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>تماس با مشتری</span>
              </a>

              <div className="flex items-center gap-2">
                {selectedBooking.status !== 'COMPLETED' && selectedBooking.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleQuickStatusUpdate(selectedBooking.id, 'COMPLETED')}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-luxury-sm cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>اصلاح انجام شد (بستن فاکتور)</span>
                  </button>
                )}

                {selectedBooking.status !== 'CONFIRMED' && selectedBooking.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleQuickStatusUpdate(selectedBooking.id, 'CONFIRMED')}
                    className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black cursor-pointer shadow-luxury-sm"
                  >
                    تایید فیش
                  </button>
                )}

                {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      if (confirm('آیا از لغو این نوبت اطمینان دارید؟')) {
                        handleQuickStatusUpdate(selectedBooking.id, 'CANCELLED');
                      }
                    }}
                    className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold border border-rose-500/30 cursor-pointer"
                  >
                    لغو / رد
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox for zooming receipt proof */}
      <ReceiptImageLightbox
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={lightboxData.imageUrl}
        amount={lightboxData.amount}
        customerName={lightboxData.customerName}
        referenceNumber={lightboxData.referenceNumber}
        uploadedAt={lightboxData.uploadedAt}
        status={lightboxData.status}
      />
    </div>
  );
}
