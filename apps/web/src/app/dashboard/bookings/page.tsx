'use client';

import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Clock,
  User,
  Phone,
  Check,
  X,
  UserX,
  FileText,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  FileImage,
  ZoomIn,
  ShieldCheck,
  Sparkles,
  Flame,
  CalendarDays,
  CheckCheck,
  Ban,
} from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { ReceiptImageLightbox } from '@/components/ui/ReceiptImageLightbox';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatTimeFa, formatNumberFa } from '@/lib/utils';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dayPriorityFilter, setDayPriorityFilter] = useState<'all' | 'today' | 'tomorrow' | 'receipts'>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
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

  // Fetch bookings list from backend API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = '/bookings?limit=150';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await ApiClient.request<any>(url);
      const list = Array.isArray(res) ? res : res?.data || [];
      setBookings(list);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  // Status transition handler: Complete (Close invoice), Confirm, Cancel
  const handleUpdateStatus = async (bookingId: string, status: string, reason?: string) => {
    try {
      setIsUpdating(true);
      const payload: any = { status };
      if (reason) payload.cancellationReason = reason;

      await ApiClient.request(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setSelectedBooking(null);
      setShowCancelModal(false);
      setCancellationReason('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت نوبت');
    } finally {
      setIsUpdating(false);
    }
  };

  // Daily Filter Logic
  const filteredBookings = bookings.filter((b) => {
    if (dayPriorityFilter === 'all') return true;

    const bDate = new Date(b.startAt);
    const now = new Date();

    if (dayPriorityFilter === 'today') {
      return (
        bDate.getFullYear() === now.getFullYear() &&
        bDate.getMonth() === now.getMonth() &&
        bDate.getDate() === now.getDate()
      );
    }

    if (dayPriorityFilter === 'tomorrow') {
      const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return (
        bDate.getFullYear() === tom.getFullYear() &&
        bDate.getMonth() === tom.getMonth() &&
        bDate.getDate() === tom.getDate()
      );
    }

    if (dayPriorityFilter === 'receipts') {
      return b.status === 'PAYMENT_SUBMITTED' || b.payments?.[0]?.status === 'PROOF_SUBMITTED';
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#172033] via-[#111726] to-[#172033] p-6 rounded-3xl border border-amber-500/20 shadow-luxury-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">مدیریت نوبت‌ها و فاکتورها</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                اولویت‌بندی روزانه، بررسی فیش‌های واریزی و ثبت اتمام اصلاح برای بستن فاکتور
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Tabs & Filters Toolbar */}
      <Card className="p-5 space-y-4 border-amber-500/15 bg-[#111726]/90">
        {/* Priority Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          <button
            type="button"
            onClick={() => setDayPriorityFilter('today')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              dayPriorityFilter === 'today'
                ? 'bg-amber-500 text-slate-950 shadow-luxury-sm font-black'
                : 'bg-[#0E131F] text-slate-400 hover:bg-white/10 hover:text-white border border-amber-500/10'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>🔥 نوبت‌های امروز</span>
          </button>

          <button
            type="button"
            onClick={() => setDayPriorityFilter('tomorrow')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              dayPriorityFilter === 'tomorrow'
                ? 'bg-amber-500 text-slate-950 shadow-luxury-sm font-black'
                : 'bg-[#0E131F] text-slate-400 hover:bg-white/10 hover:text-white border border-amber-500/10'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>📅 نوبت‌های فردا</span>
          </button>

          <button
            type="button"
            onClick={() => setDayPriorityFilter('receipts')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              dayPriorityFilter === 'receipts'
                ? 'bg-amber-500 text-slate-950 shadow-luxury-sm font-black'
                : 'bg-[#0E131F] text-slate-400 hover:bg-white/10 hover:text-white border border-amber-500/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 فیش‌های در انتظار تایید</span>
          </button>

          <button
            type="button"
            onClick={() => setDayPriorityFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              dayPriorityFilter === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm font-black'
                : 'bg-[#0E131F] text-slate-400 hover:bg-white/10 hover:text-white border border-amber-500/10'
            }`}
          >
            <span>تمام نوبت‌ها ({formatNumberFa(bookings.length)})</span>
          </button>
        </div>

        {/* Search and Secondary Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-88">
            <input
              type="text"
              placeholder="جستجو با نام مشتری، شماره تماس یا کد رهگیری نوبت..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2.5 rounded-2xl text-xs bg-[#0E131F] border border-amber-500/20 text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold px-3.5 py-2.5 rounded-2xl bg-[#0E131F] border border-amber-500/20 text-white focus:outline-none w-full sm:w-auto"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
              <option value="PAYMENT_SUBMITTED">رسید ارسال شده</option>
              <option value="CONFIRMED">تایید شده</option>
              <option value="IN_PROGRESS">در حال انجام</option>
              <option value="COMPLETED">تکمیل شده</option>
              <option value="CANCELLED">لغو شده</option>
              <option value="NO_SHOW">عدم حضور</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bookings List Section */}
      {loading ? (
        <div className="min-h-[350px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-luxury-md" />
            <p className="text-xs text-slate-400 font-bold">در حال بارگذاری لیست نوبت‌ها...</p>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            title="هیچ نوبتی در این بخش یافت نشد"
            description="نوبتی با مشخصات فیلتر شده ثبت نگردیده است."
            icon={BookMarked}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBookings.map((booking) => {
            const proof = booking.payments?.[0]?.proofs?.[0];
            const isCompleted = booking.status === 'COMPLETED';
            const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';

            return (
              <Card
                key={booking.id}
                className={`p-5.5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-3xl ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : isCancelled
                    ? 'border-slate-800 bg-slate-900/40 opacity-60'
                    : 'border-amber-500/20 bg-[#111726] hover:border-amber-500/40 hover:bg-[#161D2E] shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* Left Side: Customer & Service Profile */}
                <div className="flex items-start gap-4">
                  <Avatar name={booking.customer?.fullName || 'مشتری'} size="lg" />

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black text-white">
                        {booking.customer?.fullName || 'مشتری بدون نام'}
                      </span>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30">
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
                          className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-500/30"
                        >
                          <FileImage className="w-3 h-3 text-amber-400" />
                          <span>مشاهده فیش</span>
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-amber-300">
                        {booking.service?.name || booking.serviceNameSnapshot}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>
                        ارائه‌دهنده: {booking.staff?.displayName || booking.staffNameSnapshot || 'ارائه‌دهنده'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-black text-white">
                        {formatToman(booking.priceSnapshot || booking.price || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {formatJalaliDate(booking.startAt)}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {formatTimeFa(booking.startAt)} ({booking.durationSnapshot || booking.service?.durationMinutes || 45} دقیقه)
                      </span>
                      <a
                        href={`tel:${booking.customer?.phone}`}
                        className="flex items-center gap-1 font-mono text-emerald-400 font-bold hover:underline"
                        dir="ltr"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{booking.customer?.phone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Side: Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 flex-wrap justify-end">
                  {/* 1. Complete Button (بستن فاکتور) */}
                  {!isCompleted && !isCancelled && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black flex items-center gap-1.5 shadow-luxury-sm transition-all cursor-pointer"
                      title="اصلاح انجام شد و فاکتور بسته شود"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>اصلاح انجام شد (بستن فاکتور)</span>
                    </button>
                  )}

                  {/* 2. Quick Confirm Button */}
                  {booking.status === 'PENDING_PAYMENT' || booking.status === 'PAYMENT_SUBMITTED' ? (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                      className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-luxury-sm cursor-pointer"
                    >
                      تایید فیش
                    </button>
                  ) : null}

                  {/* 3. Quick Cancel Button */}
                  {!isCompleted && !isCancelled ? (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowCancelModal(true);
                      }}
                      className="px-3 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold cursor-pointer"
                    >
                      لغو نوبت
                    </button>
                  ) : null}

                  {/* 4. Details & Receipt Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer border border-white/5"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>رسید و فاکتور</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. Comprehensive Booking Receipt & Details Modal     */}
      {/* ---------------------------------------------------- */}
      {selectedBooking && !showCancelModal && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title="رسید الکترونیکی و فاکتور نوبت"
          maxWidth="lg"
        >
          <div className="space-y-6 text-right">
            {/* Customer Profile Card */}
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

            {/* Receipt Image Proof Section */}
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
                        alt="فیش واریزی"
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
                    پرداخت در محل / ثبت حضوری
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
                <span className="text-slate-400 text-[11px] block">ساعت و مدت زمان</span>
                <span className="font-bold text-white">
                  {formatTimeFa(selectedBooking.startAt)} ({selectedBooking.durationSnapshot || selectedBooking.service?.durationMinutes || 45} دقیقه)
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0E131F] border border-amber-500/15 space-y-1 col-span-2">
                <span className="text-slate-400 text-[11px] block">خدمت و ارائه‌دهنده</span>
                <span className="font-bold text-white">
                  {selectedBooking.service?.name || selectedBooking.serviceNameSnapshot} — ارائه‌دهنده:{' '}
                  {selectedBooking.staff?.displayName || selectedBooking.staffNameSnapshot || 'ارائه‌دهنده'}
                </span>
              </div>
            </div>

            {/* Notes if any */}
            {selectedBooking.notes && (
              <div className="p-3.5 rounded-2xl bg-[#0E131F] border border-amber-500/20 text-xs space-y-1">
                <span className="font-bold text-amber-400 block">یادداشت مشتری:</span>
                <p className="text-slate-300 leading-relaxed">{selectedBooking.notes}</p>
              </div>
            )}

            {/* Cancellation Reason if cancelled */}
            {selectedBooking.cancellationReason && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs space-y-1">
                <span className="font-bold text-rose-300 block">علت لغو نوبت:</span>
                <p className="text-rose-400 leading-relaxed">{selectedBooking.cancellationReason}</p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <a
                href={`tel:${selectedBooking.customer?.phone}`}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-white/5"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>تماس با مشتری ({selectedBooking.customer?.phone})</span>
              </a>

              <div className="flex items-center gap-2 justify-end">
                {selectedBooking.status !== 'COMPLETED' && selectedBooking.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'COMPLETED')}
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
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CONFIRMED')}
                    className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black cursor-pointer shadow-luxury-sm"
                  >
                    تایید فیش
                  </button>
                )}

                {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setShowCancelModal(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold cursor-pointer"
                  >
                    لغو نوبت
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. Cancellation Prompt Modal with Reason Input       */}
      {/* ---------------------------------------------------- */}
      {showCancelModal && selectedBooking && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancellationReason('');
          }}
          title="لغو نوبت رزرو"
        >
          <div className="space-y-4 text-right">
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                آیا از لغو نوبت {selectedBooking.customer?.fullName} اطمینان دارید؟
              </span>
              <p className="text-[11px] text-rose-400 leading-relaxed">
                پس از لغو، وضعیت نوبت به «لغو شده» تغییر یافته و فاکتور باطل می‌شود.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                علت لغو نوبت (اختیاری):
              </label>
              <textarea
                rows={3}
                placeholder="مثال: درخواست مشتری، عدم حضور، جابجایی زمان..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-3.5 rounded-2xl text-xs bg-[#0E131F] border border-amber-500/20 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
              >
                انصراف
              </Button>
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED', cancellationReason)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                تایید و لغو نوبت
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Smooth Animated Receipt Lightbox */}
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
