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

  // Fetch Organization Profile
  useEffect(() => {
    async function loadOrg() {
      try {
        setLoading(true);
        const data = await ApiClient.request<any>(`/public/organizations/${params.slug}`);
        setOrg(data);

        // Check if serviceId is passed via URL query
        const preselectedServiceId = searchParams.get('serviceId');
        if (preselectedServiceId && data.services) {
          const found = data.services.find((s: any) => s.id === preselectedServiceId);
          if (found) {
            setSelectedService(found);
            setStep(2);
          }
        }

        // Initialize date to today in YYYY-MM-DD
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
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
        setAvailableSlots(slots);
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

      await ApiClient.request('/public/payments/proof', {
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

  // Available dates for quick picker (next 14 days)
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
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-emerald-500">
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
            { s: 3, label: 'زمان' },
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
              <h2 className="text-base font-black text-slate-900">۳. انتخاب تاریخ و سانس نوبت</h2>
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
                    className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl border transition-all ${
                      selectedDate === opt.isoString
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
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
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">سانس‌های آزاد برای این روز:</label>
              {slotsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">در حال استعلام زمان‌های خالی...</div>
              ) : availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                  هیچ سانس خالی در این روز یافت نشد. لطفاً روز دیگری را انتخاب فرمایید.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.startAt}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedSlot?.startAt === slot.startAt
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500'
                      }`}
                    >
                      {slot.startTimeLocal}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="w-full py-3 text-sm font-bold mt-4"
            >
              مرحله بعد: اطلاعات تماس
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
                <span className="font-bold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">زمان:</span>
                <span className="font-bold">
                  {selectedSlot?.startTimeLocal} - {formatJalaliDate(selectedSlot?.startAt)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-800 pt-1 border-t border-emerald-200">
                <span className="font-bold">مبلغ قابل پرداخت:</span>
                <span className="font-black">{formatToman(selectedService?.price)}</span>
              </div>
            </div>

            <Input
              label="نام و نام خانوادگی"
              required
              placeholder="مثال: علی احمدی"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <Input
              label="شماره موبایل"
              required
              type="tel"
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              helperText="جهت ارسال پیامک تایید و هماهنگی"
            />

            <Input
              label="ایمیل (اختیاری)"
              type="email"
              placeholder="ali@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />

            <Input
              label="توضیحات یا درخواست خاص (اختیاری)"
              placeholder="توضیحات تکمیلی..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {bookingError}
              </div>
            )}

            <Button type="submit" isLoading={isSubmittingBooking} className="w-full py-3.5 text-sm font-bold mt-2">
              ثبت رزرو و ورود به درگاه کارت‌به‌کارت
            </Button>
          </form>
        )}

        {/* STEP 5: PAYMENT & RECEIPT UPLOAD */}
        {step === 5 && createdBooking && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-base font-black text-slate-900">۵. انتقال وجه و آپلود رسید پرداخت</h2>
              <p className="text-xs text-slate-500 mt-1">
                نوبت شما به صورت موقت ثبت گردید. لطفاً مبلغ را واریز و رسید آن را آپلود نمایید.
              </p>
            </div>

            {/* Bank Card Info */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>شماره کارت جهت واریز</span>
                <span>{cardDetails?.bankName || 'بانک مقصد'}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="font-mono text-base sm:text-lg tracking-widest text-emerald-400 font-bold" dir="ltr">
                  {cardDetails?.cardNumber || '۶۰۳۷۹۹۷۱۲۳۴۵۶۷۸۹'}
                </span>
                <button
                  onClick={() => handleCopyCard(cardDetails?.cardNumber || '6037997123456789')}
                  className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCard ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-400">به نام:</span>
                <span className="font-bold">{cardDetails?.cardHolderName || org.name}</span>
              </div>

              <div className="flex justify-between text-xs border-t border-slate-800 pt-3">
                <span className="text-slate-400">مبلغ قابل واریز:</span>
                <span className="font-black text-emerald-400 text-sm">{formatToman(createdBooking.price)}</span>
              </div>
            </div>

            {/* Receipt Upload Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">تصویر یا فایل رسید تراکنش:</label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 bg-white transition-colors">
                {receiptPreview ? (
                  <div className="space-y-3">
                    <img
                      src={receiptPreview}
                      alt="Receipt Preview"
                      className="max-h-48 mx-auto rounded-xl object-contain shadow-sm border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      انتخاب فایل دیگر
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer space-y-2 flex flex-col items-center">
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">کلیک برای انتخاب فایل رسید (عکس یا PDF)</span>
                    <span className="text-[10px] text-slate-400">حداکثر حجم: ۱۰ مگابایت (JPG, PNG, PDF)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setReceiptFile(file);
                          if (file.type.startsWith('image/')) {
                            setReceiptPreview(URL.createObjectURL(file));
                          } else {
                            setReceiptPreview('https://placehold.co/200x100?text=PDF+Document');
                          }
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              disabled={!receiptFile}
              isLoading={isUploadingReceipt}
              onClick={handleSubmitPaymentProof}
              className="w-full py-3.5 text-sm font-bold"
            >
              ارسال رسید و نهایی‌سازی نوبت
            </Button>
          </div>
        )}

        {/* STEP 6: CONFIRMATION & STATUS */}
        {step === 6 && createdBooking && (
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-lg text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">نوبت شما با موفقیت ثبت گردید!</h2>
              <p className="text-xs text-slate-500">رسید پرداخت شما دریافت شد و توسط مدیریت بررسی خواهد شد.</p>
            </div>

            {/* Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-right space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">کد پیگیری نوبت:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">{createdBooking.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">خدمت:</span>
                <span className="font-bold">{createdBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">زمان:</span>
                <span className="font-bold">{formatJalaliDate(createdBooking.startAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">وضعیت فعلی:</span>
                <Badge status="PAYMENT_SUBMITTED" />
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/booking/status/${createdBooking.accessToken}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-emerald-600 transition-colors w-full"
              >
                <span>مشاهده صفحه پیگیری اختصاصی نوبت</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
