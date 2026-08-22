'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Scissors,
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  CreditCard,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  Info,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatNumberFa, gregorianToJalali } from '@/lib/utils';

export default function BookingWizardPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [org, setOrg] = useState<any>(null);

  // Form State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null); // null = Any available
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Customer State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [bookingError, setBookingError] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Created Booking State
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);

  // Payment Upload State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  const [paymentDone, setPaymentDone] = useState<boolean>(false);

  // Initialize Date Options (Next 14 Days)
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const isoString = `${yyyy}-${mm}-${dd}`;
    const [jy, jm, jd] = gregorianToJalali(yyyy, d.getMonth() + 1, d.getDate());
    const weekdays = ['۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'جمعه', 'شنبه'];
    const weekdayName = weekdays[d.getDay()];

    return {
      isoString,
      dayNumber: formatNumberFa(jd),
      weekdayName,
      fullJalali: formatJalaliDate(d),
      isFriday: d.getDay() === 5,
    };
  });

  // Fetch Organization Profile
  useEffect(() => {
    async function loadOrg() {
      try {
        setLoading(true);
        const data = await ApiClient.request<any>(`/public/organizations/${params.slug}`);
        setOrg(data);

        // Check if serviceId is passed via URL query
        const preselectedServiceId = searchParams.get('serviceId');
        if (preselectedServiceId && preselectedServiceId.trim() !== '' && data.services) {
          const found = data.services.find((s: any) => s.id === preselectedServiceId);
          if (found) {
            setSelectedService(found);
            setStep(2);
          }
        }

        // Initialize date to first non-friday date
        const firstAvailableDate = dateOptions.find((d) => !d.isFriday) || dateOptions[0];
        setSelectedDate(firstAvailableDate.isoString);
      } catch (err: any) {
        console.error('Failed to load organization', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrg();
  }, [params.slug, searchParams]);

  // Fetch Slots when Date, Service, or Staff changes
  useEffect(() => {
    if (!selectedService || !selectedDate || !org) return;

    async function loadSlots() {
      try {
        setSlotsLoading(true);
        setSelectedSlot(null);
        let url = `/public/organizations/${params.slug}/availability?serviceId=${selectedService.id}&date=${selectedDate}`;
        if (selectedStaff) {
          url += `&staffId=${selectedStaff.id}`;
        }
        const slots = await ApiClient.request<any[]>(url);
        setAvailableSlots(slots || []);
      } catch (err: any) {
        console.error('Failed to load slots', err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    loadSlots();
  }, [selectedService, selectedStaff, selectedDate, org, params.slug]);

  // Copy card number to clipboard
  const handleCopyCard = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  // Submit Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !selectedSlot) return;

    try {
      setIsSubmittingBooking(true);
      setBookingError('');

      const payload = {
        serviceId: selectedService.id,
        staffId: selectedStaff?.id || undefined,
        startAt: selectedSlot.startAt,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        notes: notes || undefined,
      };

      const result = await ApiClient.request<any>(`/public/organizations/${params.slug}/bookings`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreatedBooking(result.booking);
      setCardDetails(result.cardAccount);
      setStep(5); // Go to Payment Step
    } catch (err: any) {
      setBookingError(err.message || 'خطا در ثبت نوبت. لطفاً زمان دیگری را امتحان کنید.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Submit Receipt Proof
  const handleSubmitPaymentProof = async () => {
    if (!receiptFile || !createdBooking) return;

    try {
      setIsUploadingReceipt(true);
      const uploaded = await ApiClient.uploadFile(receiptFile);

      await ApiClient.request('/payments/proof', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: createdBooking.id,
          fileUrl: uploaded.fileUrl,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.size,
          amount: createdBooking.price,
        }),
      });

      setPaymentDone(true);
      setStep(6); // Confirmation
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال رسید پرداخت');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">در حال بارگذاری فرم رزرو...</span>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-600">کسب‌وکار مورد نظر یافت نشد.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-emerald-500 text-right">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={`/${org.slug}`}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>بازگشت به صفحه کسب‌وکار</span>
          </Link>
          <span className="text-xs font-bold text-slate-900">{org.name}</span>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-8">
          {[
            { s: 1, label: 'خدمت' },
            { s: 2, label: 'ارائه‌دهنده' },
            { s: 3, label: 'زمان و سانس' },
            { s: 4, label: 'اطلاعات' },
            { s: 5, label: 'پرداخت' },
            { s: 6, label: 'تایید' },
          ].map((item) => (
            <div key={item.s} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === item.s
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : step > item.s
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > item.s ? <Check className="w-3.5 h-3.5" /> : formatNumberFa(item.s)}
              </div>
              <span className="text-[10px] font-semibold text-slate-600 hidden sm:block">{item.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: SERVICE SELECTION */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-black text-slate-900">۱. انتخاب خدمت مورد نظر</h2>
            <div className="space-y-3">
              {org.services?.map((service: any) => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedService?.id === service.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
                    {service.description && <p className="text-xs text-slate-500">{service.description}</p>}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{service.durationMinutes} دقیقه</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black text-emerald-700 block">{formatToman(service.price)}</span>
                    <span className="text-[10px] text-slate-400">انتخاب</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: STAFF SELECTION */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">۲. انتخاب ارائه‌دهنده خدمت</h2>
              <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-800">
                تغییر خدمت
              </button>
            </div>

            <div className="space-y-3">
              {/* Option: Any available staff */}
              <div
                onClick={() => {
                  setSelectedStaff(null);
                  setStep(3);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  selectedStaff === null ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">اولین ارائه‌دهنده در دسترس</h4>
                  <p className="text-xs text-slate-500">رزرو سریع با نزدیک‌ترین زمان خالی ممکن</p>
                </div>
              </div>

              {/* Specific Staff */}
              {org.staffMembers?.map((staff: any) => (
                <div
                  key={staff.id}
                  onClick={() => {
                    setSelectedStaff(staff);
                    setStep(3);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    selectedStaff?.id === staff.id ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  {staff.avatarUrl ? (
                    <img src={staff.avatarUrl} alt={staff.displayName} className="w-12 h-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {staff.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{staff.displayName}</h4>
                    <p className="text-xs text-slate-500">{staff.bio || 'متخصص'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DATE & TIME SELECTION */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">۳. انتخاب تاریخ و سانس نوبت</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  خدمت انتخاب شده: <strong className="text-slate-800">{selectedService?.name}</strong> ({selectedService?.durationMinutes} دقیقه)
                </p>
              </div>
              <button onClick={() => setStep(2)} className="text-xs text-slate-500 hover:text-slate-800">
                تغییر ارائه‌دهنده
              </button>
            </div>

            {/* Horizontal Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">انتخاب روز:</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.isoString}
                    onClick={() => setSelectedDate(opt.isoString)}
                    className={`flex flex-col items-center justify-center min-w-[68px] h-20 rounded-2xl border transition-all ${
                      selectedDate === opt.isoString
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                        : opt.isFriday
                        ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-70'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[11px] font-medium opacity-80">{opt.weekdayName}</span>
                    <span className="text-lg font-black">{opt.dayNumber}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">سانس‌های خالی برای این روز:</label>
                {availableSlots.length > 0 && (
                  <span className="text-[11px] text-emerald-700 font-bold">
                    {formatNumberFa(availableSlots.length)} سانس قابل رزرو
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">در حال استعلام زمان‌های خالی...</div>
              ) : availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500 space-y-2">
                  <p>هیچ سانس خالی برای این روز یافت نشد (یا روز تعطیل است).</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">لطفاً روزهای دیگر را در نوار بالا انتخاب فرمایید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.startAt === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3.5 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/30'
                        }`}
                      >
                        <span className="font-mono text-sm tracking-wide">
                          {slot.startTimeLocal} تا {slot.endTimeLocal}
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {slot.durationMinutes} دقیقه
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="w-full py-3.5 text-sm font-bold mt-4"
            >
              مرحله بعد: ثبت مشخصات شما
            </Button>
          </div>
        )}

        {/* STEP 4: CUSTOMER INFORMATION */}
        {step === 4 && (
          <form onSubmit={handleCreateBooking} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">۴. اطلاعات شما برای ثبت نوبت</h2>
              <button type="button" onClick={() => setStep(3)} className="text-xs text-slate-500 hover:text-slate-800">
                تغییر زمان
              </button>
            </div>

            {/* Booking Summary Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="font-semibold">خدمت:</span>
                <span className="font-bold text-slate-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">ارائه‌دهنده:</span>
                <span>{selectedStaff ? selectedStaff.displayName : 'اولین ارائه‌دهنده در دسترس'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">زمان رزرو:</span>
                <span className="font-bold text-emerald-800">
                  {selectedSlot?.startTimeLocal} تا {selectedSlot?.endTimeLocal} ({formatJalaliDate(new Date(selectedSlot?.startAt))})
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-emerald-200/60 font-black text-emerald-900">
                <span>مبلغ قابل پرداخت:</span>
                <span>{formatToman(selectedService?.price)}</span>
              </div>
            </div>

            {bookingError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {bookingError}
              </div>
            )}

            <div className="space-y-3">
              <Input
                label="نام و نام خانوادگی"
                required
                placeholder="مثال: علی احمدی"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <Input
                label="شماره تلفن همراه"
                required
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                helperText="کد پیگیری و وضعیت نوبت از طریق پیامک به این شماره ارسال خواهد شد"
              />

              <Input
                label="آدرس ایمیل (اختیاری)"
                type="email"
                placeholder="example@mail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">توضیحات یا درخواست خاص (اختیاری):</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="هرگونه یادداشت برای آرایشگر..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 text-xs bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmittingBooking}
              className="w-full py-3.5 text-sm font-bold mt-2"
            >
              ثبت و رفتن به مرحله پرداخت کارت‌به‌کارت
            </Button>
          </form>
        )}

        {/* STEP 5: CARD-TO-CARD PAYMENT */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">۵. پرداخت کارت‌به‌کارت و ارسال رسید</h2>
              <p className="text-xs text-slate-500 mt-1">
                نوبت شما با کد <strong className="text-slate-900 font-mono">{createdBooking?.code}</strong> ثبت موقت شد. لطفاً مبلغ را به کارت زیر واریز و رسید را بارگذاری فرمایید.
              </p>
            </div>

            {/* Bank Card Box */}
            {cardDetails && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-xl space-y-4">
                <div className="flex justify-between items-center text-xs text-emerald-200">
                  <span>{cardDetails.bankName || 'حساب بانکی کسب‌وکار'}</span>
                  <span>{org.name}</span>
                </div>

                <div className="py-2">
                  <span className="text-xs text-slate-400 block mb-1">شماره کارت:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl sm:text-2xl font-black tracking-widest" dir="ltr">
                      {cardDetails.cardNumber}
                    </span>
                    <button
                      onClick={() => handleCopyCard(cardDetails.cardNumber)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs flex items-center gap-1.5"
                    >
                      {copiedCard ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span className="hidden sm:inline">{copiedCard ? 'کپی شد' : 'کپی'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10">
                  <div>
                    <span className="text-slate-400 block text-[10px]">صاحب حساب:</span>
                    <span className="font-bold">{cardDetails.cardHolderName}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-400 block text-[10px]">مبلغ قابل واریز:</span>
                    <span className="font-black text-emerald-400 text-sm">{formatToman(createdBooking?.price)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">تصویر یا فایل PDF فیش واریزی:</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-white cursor-pointer transition-colors relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReceiptFile(file);
                      if (file.type.startsWith('image/')) {
                        setReceiptPreview(URL.createObjectURL(file));
                      }
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {receiptPreview ? (
                  <div className="space-y-2">
                    <img src={receiptPreview} alt="Receipt preview" className="max-h-48 mx-auto rounded-xl shadow-sm" />
                    <span className="text-xs text-emerald-700 font-bold block">{receiptFile?.name}</span>
                    <span className="text-[10px] text-slate-400">برای تغییر کلیک کنید</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">کلیک برای انتخاب فایل رسید بانکی</p>
                    <p className="text-[10px] text-slate-400">فرمت‌های مجاز: JPG، PNG، WEBP، PDF (حداکثر ۱۰ مگابایت)</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              disabled={!receiptFile}
              isLoading={isUploadingReceipt}
              onClick={handleSubmitPaymentProof}
              className="w-full py-3.5 text-sm font-bold"
            >
              ارسال رسید و نهایی کردن درخواست نوبت
            </Button>
          </div>
        )}

        {/* STEP 6: CONFIRMATION & ACCESS TOKEN */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900">رسید با موفقیت ثبت شد!</h2>
              <p className="text-xs text-slate-500">
                درخواست نوبت شما ثبت و در صف تایید مدیریت قرار گرفت.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 text-right space-y-3 shadow-sm text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">کد پیگیری نوبت:</span>
                <span className="font-mono font-black text-base text-emerald-700">{createdBooking?.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">خدمت:</span>
                <span className="font-bold text-slate-900">{createdBooking?.serviceNameSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">زمان نوبت:</span>
                <span className="font-bold text-slate-900">
                  {formatJalaliDate(new Date(createdBooking?.startAt))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">مبلغ پرداخت شده:</span>
                <span className="font-black text-emerald-700">{formatToman(createdBooking?.priceSnapshot)}</span>
              </div>
            </div>

            {createdBooking?.accessToken && (
              <div className="space-y-3">
                <Link
                  href={`/booking/status/${createdBooking.accessToken}`}
                  className="block w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-md"
                >
                  مشاهده صفحه پیگیری زنده وضعیت نوبت
                </Link>

                <Link
                  href={`/${org.slug}`}
                  className="block text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  بازگشت به صفحه اصلی آرایشگاه
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
