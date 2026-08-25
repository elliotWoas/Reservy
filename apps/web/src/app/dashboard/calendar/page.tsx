'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  User,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ApiClient } from '@/lib/api-client';
import {
  formatToman,
  formatJalaliDate,
  formatJalaliShort,
  formatTimeFa,
  formatNumberFa,
  gregorianToJalali,
} from '@/lib/utils';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [bookings, setBookings] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Manual Booking Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [mServiceId, setMServiceId] = useState<string>('');
  const [mStaffId, setMStaffId] = useState<string>('');
  const [mDate, setMDate] = useState<string>('');
  const [mSlot, setMSlot] = useState<any>(null);
  const [mCustName, setMCustName] = useState<string>('');
  const [mCustPhone, setMCustPhone] = useState<string>('');
  const [mNotes, setMNotes] = useState<string>('');
  const [mSlotsLoading, setMSlotsLoading] = useState<boolean>(false);
  const [mAvailableSlots, setMAvailableSlots] = useState<any[]>([]);
  const [mSubmitting, setMSubmitting] = useState<boolean>(false);
  const [mError, setMError] = useState<string>('');

  // Selected Booking Details Modal
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Load Catalog Staff & Services
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [staffRes, servicesRes] = await Promise.all([
          ApiClient.request<any[]>('/catalog/staff'),
          ApiClient.request<any[]>('/catalog/services'),
        ]);
        setStaffList(staffRes);
        setServicesList(servicesRes);
      } catch (err) {
        console.error('Failed to load catalog', err);
      }
    }
    loadCatalog();
  }, []);

  // Check URL query for new manual booking modal
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsManualModalOpen(true);
    }
  }, [searchParams]);

  // Load Bookings for current range
  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');

        let startDateStr = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
        let endDateStr = `${yyyy}-${mm}-${dd}T23:59:59.999Z`;

        if (viewMode === 'week') {
          const weekStart = new Date(currentDate);
          weekStart.setDate(weekStart.getDate() - 3);
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 4);
          startDateStr = weekStart.toISOString();
          endDateStr = weekEnd.toISOString();
        }

        let url = `/bookings?startDate=${startDateStr}&endDate=${endDateStr}`;
        if (selectedStaffId) {
          url += `&staffId=${selectedStaffId}`;
        }

        const res = await ApiClient.request<any>(url);
        setBookings(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        console.error('Failed to load bookings', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [currentDate, viewMode, selectedStaffId]);

  // Query slots for manual modal
  useEffect(() => {
    if (!mServiceId || !mDate) return;
    async function fetchSlots() {
      try {
        setMSlotsLoading(true);
        setMSlot(null);
        let url = `/availability/slots?serviceId=${mServiceId}&date=${mDate}`;
        if (mStaffId) url += `&staffId=${mStaffId}`;
        const slots = await ApiClient.request<any[]>(url);
        setMAvailableSlots(slots);
      } catch (err) {
        setMAvailableSlots([]);
      } finally {
        setMSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [mServiceId, mStaffId, mDate]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Submit Manual Booking
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mServiceId || !mSlot || !mCustName || !mCustPhone) return;

    try {
      setMSubmitting(true);
      setMError('');
      await ApiClient.request('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: mServiceId,
          staffId: mStaffId || undefined,
          startAt: mSlot.startAt,
          customerName: mCustName,
          customerPhone: mCustPhone,
          notes: mNotes || undefined,
          status: 'CONFIRMED',
        }),
      });

      setIsManualModalOpen(false);
      // Reset form
      setMCustName('');
      setMCustPhone('');
      setMNotes('');
      setMSlot(null);
      // Reload bookings
      setCurrentDate(new Date(currentDate));
    } catch (err: any) {
      setMError(err.message || 'خطا در ثبت نوبت دستی');
    } finally {
      setMSubmitting(false);
    }
  };

  // Update Status from modal
  const handleUpdateStatus = async (status: string) => {
    if (!selectedBooking) return;
    try {
      await ApiClient.request(`/bookings/${selectedBooking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSelectedBooking(null);
      setCurrentDate(new Date(currentDate));
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت');
    }
  };

  // Generate hourly blocks from 09:00 to 22:00
  const hours = Array.from({ length: 14 }, (_, i) => i + 9);

  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">تقویم کاری و نوبت‌ها</h1>
          <p className="text-xs text-slate-500">{formatJalaliDate(currentDate)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Staff Filter */}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none"
          >
            <option value="">همه ارائه‌دهندگان</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.displayName}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              روزانه
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              هفتگی
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Button size="sm" variant="outline" onClick={handleToday}>
              امروز
            </Button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              const yyyy = currentDate.getFullYear();
              const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
              const dd = String(currentDate.getDate()).padStart(2, '0');
              setMDate(`${yyyy}-${mm}-${dd}`);
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت نوبت دستی</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid View */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[600px] divide-y divide-slate-100">
            {hours.map((hour) => {
              const timeString = `${hour.toString().padStart(2, '0')}:00`;
              // Find bookings that fall in this hour
              const hourBookings = bookings.filter((b) => {
                const bDate = new Date(b.startAt);
                return bDate.getHours() === hour;
              });

              return (
                <div key={hour} className="flex min-h-[72px] hover:bg-slate-50/50 transition-colors">
                  {/* Time column */}
                  <div className="w-20 p-3 border-l border-slate-100 flex items-start justify-center text-xs font-bold text-slate-400">
                    {timeString}
                  </div>

                  {/* Booking Slots Area */}
                  <div className="flex-1 p-2 flex flex-wrap gap-2 items-center">
                    {hourBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer shadow-sm transition-all hover:scale-[1.01] flex items-center gap-3 ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : b.status === 'PAYMENT_SUBMITTED'
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{b.customer?.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({formatTimeFa(b.startAt)})</span>
                          </div>
                          <p className="text-[11px] opacity-80">{b.service?.name}</p>
                        </div>
                        <Badge status={b.status} className="text-[10px]" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Manual Booking Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="ثبت نوبت دستی جدید (تلفنی / حضوری)"
        description="ثبت نوبت با اعتبارسنجی خودکار زمان‌های آزاد جهت جلوگیری از هرگونه تداخل"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateManualBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">انتخاب خدمت:</label>
              <select
                required
                value={mServiceId}
                onChange={(e) => setMServiceId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800"
              >
                <option value="">-- انتخاب خدمت --</option>
                {servicesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} دقیقه - {formatToman(s.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ارائه‌دهنده:</label>
              <select
                value={mStaffId}
                onChange={(e) => setMStaffId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800"
              >
                <option value="">اولین فرد در دسترس</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Input
              label="تاریخ نوبت (YYYY-MM-DD)"
              required
              type="date"
              value={mDate}
              onChange={(e) => setMDate(e.target.value)}
            />
          </div>

          {/* Slots Selector */}
          {mServiceId && mDate && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">سانس خالی:</label>
              {mSlotsLoading ? (
                <div className="text-xs text-slate-400 py-4 text-center">در حال استعلام زمان‌های خالی...</div>
              ) : mAvailableSlots.length === 0 ? (
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl">
                  هیچ سانس خالی در این روز یافت نشد.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {mAvailableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.startAt}
                      onClick={() => setMSlot(slot)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                        mSlot?.startAt === slot.startAt
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-white hover:border-emerald-500'
                      }`}
                    >
                      {slot.startTimeLocal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="نام مشتری"
              required
              placeholder="مثال: رضا کریمی"
              value={mCustName}
              onChange={(e) => setMCustName(e.target.value)}
            />
            <Input
              label="شماره موبایل مشتری"
              required
              type="tel"
              placeholder="۰۹۱۲۰۰۰۰۰۰۰"
              value={mCustPhone}
              onChange={(e) => setMCustPhone(e.target.value)}
            />
          </div>

          <Input
            label="یادداشت یا توضیحات (اختیاری)"
            placeholder="رزرو تلفنی..."
            value={mNotes}
            onChange={(e) => setMNotes(e.target.value)}
          />

          {mError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{mError}</div>
          )}

          <Button
            type="submit"
            disabled={!mSlot}
            isLoading={mSubmitting}
            className="w-full py-3 font-bold text-xs mt-2"
          >
            تایید و ثبت قطعی نوبت
          </Button>
        </form>
      </Modal>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBooking(null)}
          title={`جزئیات نوبت ${selectedBooking.code}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-semibold">وضعیت نوبت:</span>
              <Badge status={selectedBooking.status} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">نام مشتری:</span>
                <span className="font-bold text-slate-900">{selectedBooking.customer?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شماره موبایل:</span>
                <span className="font-bold text-slate-900" dir="ltr">{selectedBooking.customer?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">خدمت:</span>
                <span className="font-bold text-slate-900">{selectedBooking.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ارائه‌دهنده:</span>
                <span className="font-bold text-slate-900">{selectedBooking.staff?.displayName || 'نامشخص'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">زمان نوبت:</span>
                <span className="font-bold text-slate-900">{formatJalaliDate(selectedBooking.startAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">مبلغ:</span>
                <span className="font-black text-emerald-700">{formatToman(selectedBooking.price)}</span>
              </div>
            </div>

            {/* Status change actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="block font-semibold text-slate-700">عملیات روی نوبت:</span>
              <div className="flex flex-wrap gap-2">
                {selectedBooking.status !== 'CONFIRMED' && (
                  <Button size="sm" onClick={() => handleUpdateStatus('CONFIRMED')}>
                    تایید نوبت
                  </Button>
                )}
                {selectedBooking.status !== 'COMPLETED' && (
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus('COMPLETED')}>
                    ثبت به عنوان انجام شده
                  </Button>
                )}
                {selectedBooking.status !== 'CANCELLED' && (
                  <Button size="sm" variant="danger" onClick={() => handleUpdateStatus('CANCELLED')}>
                    لغو نوبت
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
