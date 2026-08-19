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
} from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatTimeFa, formatNumberFa } from '@/lib/utils';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = '/bookings?limit=100';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await ApiClient.request<any>(url);
      setBookings(res.data || []);
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

  const handleUpdateStatus = async (status: string) => {
    if (!selectedBooking) return;
    try {
      await ApiClient.request(`/bookings/${selectedBooking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">مدیریت نوبت‌ها</h1>
          <p className="text-xs text-slate-500">لیست تمامی رزروهای ثبت شده توسط مشتریان یا سیستم</p>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="جستجو با نام مشتری، شماره تماس یا کد نوبت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none w-full sm:w-auto"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
            <option value="PAYMENT_SUBMITTED">رسید ارسال شده</option>
            <option value="CONFIRMED">تایید شده</option>
            <option value="COMPLETED">تکمیل شده</option>
            <option value="CANCELLED">لغو شده</option>
            <option value="NO_SHOW">عدم مراجعه</option>
          </select>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">در حال بارگذاری لیست نوبت‌ها...</div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="هیچ نوبتی یافت نشد"
            description="نوبتی با فیلترهای انتخابی شما در سیستم وجود ندارد."
            icon={BookMarked}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">کد نوبت</th>
                  <th className="p-4">مشتری</th>
                  <th className="p-4">خدمت</th>
                  <th className="p-4">ارائه‌دهنده</th>
                  <th className="p-4">تاریخ و زمان</th>
                  <th className="p-4">مبلغ</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700">{b.code}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{b.customer?.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{b.customer?.phone}</span>
                    </td>
                    <td className="p-4 font-medium text-slate-800">{b.service?.name}</td>
                    <td className="p-4 text-slate-600">{b.staff?.displayName || 'نامشخص'}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block">{formatJalaliDate(b.startAt)}</span>
                      <span className="text-[10px] text-slate-500">{formatTimeFa(b.startAt)}</span>
                    </td>
                    <td className="p-4 font-black text-emerald-700">{formatToman(b.price)}</td>
                    <td className="p-4">
                      <Badge status={b.status} />
                    </td>
                    <td className="p-4 text-left">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBooking(b)}
                        className="text-[11px] py-1 px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5 ml-1" />
                        <span>جزئیات</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBooking(null)}
          title={`مدیریت نوبت ${selectedBooking.code}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-semibold">وضعیت فعلی:</span>
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
              {selectedBooking.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-1">یادداشت مشتری:</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 text-slate-800 text-[11px]">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            {/* Status change actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="block font-semibold text-slate-700">تغییر وضعیت نوبت:</span>
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
                {selectedBooking.status !== 'NO_SHOW' && (
                  <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('NO_SHOW')}>
                    عدم مراجعه مشتری
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
