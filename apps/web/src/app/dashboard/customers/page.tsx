'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, FileText, Phone, Calendar, ArrowLeft } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatNumberFa } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Selected Customer for Notes Editor
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = '/crm?limit=100';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await ApiClient.request<any>(url);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleOpenNotes = (c: any) => {
    setSelectedCustomer(c);
    setNotes(c.notes || '');
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      setIsSavingNotes(true);
      await ApiClient.request(`/crm/${selectedCustomer.id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره یادداشت');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">مدیریت ارتباط با مشتریان (CRM)</h1>
          <p className="text-xs text-slate-500">لیست سوابق مراجعات، مجموع دریافتی‌ها و یادداشت‌های پرسنل برای هر مشتری</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <input
            type="text"
            placeholder="جستجو با نام یا شماره تماس مشتری..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </form>
      </Card>

      {/* Customers Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">در حال بارگذاری پرونده مشتریان...</div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="هیچ مشتری‌ای یافت نشد"
            description="با ثبت اولین نوبت‌ها، پرونده مشتریان به صورت خودکار ایجاد می‌شود."
            icon={Users}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">نام مشتری</th>
                  <th className="p-4">شماره تماس</th>
                  <th className="p-4">تعداد نوبت‌ها</th>
                  <th className="p-4">مجموع خرید</th>
                  <th className="p-4">آخرین مراجعه</th>
                  <th className="p-4">نوبت بعدی</th>
                  <th className="p-4 text-left">یادداشت و پرونده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{c.fullName}</td>
                    <td className="p-4 font-mono font-medium text-slate-700" dir="ltr">{c.phone}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800">{formatNumberFa(c.totalBookings)} نوبت</span>
                      <span className="text-[10px] text-slate-400 block">
                        ({formatNumberFa(c.completedBookings)} انجام شده / {formatNumberFa(c.cancelledBookings)} لغو)
                      </span>
                    </td>
                    <td className="p-4 font-black text-emerald-700">{formatToman(c.totalSpent)}</td>
                    <td className="p-4 text-slate-600">
                      {c.lastVisit ? formatJalaliDate(c.lastVisit) : '—'}
                    </td>
                    <td className="p-4 text-slate-600">
                      {c.nextBooking ? (
                        <span className="text-emerald-700 font-bold">{formatJalaliDate(c.nextBooking)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 text-left">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenNotes(c)}
                        className="text-[11px] py-1 px-3"
                      >
                        <FileText className="w-3.5 h-3.5 ml-1" />
                        <span>{c.notes ? 'مشاهده یادداشت' : 'ثبت یادداشت'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Customer Notes Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomer(null)}
          title={`پرونده و یادداشت‌های مشتری: ${selectedCustomer.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveNotes} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>شماره تماس:</span>
                <span className="font-mono font-bold" dir="ltr">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span>مجموع دریافتی تایید شده:</span>
                <span className="font-black text-emerald-700">{formatToman(selectedCustomer.totalSpent)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                یادداشت‌های محرمانه پرسنل (علایق، ترجیحات، حساسیت‌ها):
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: مشتری حساسیت به اسپری دارد، مدل موی فید با شماره ۰.۵ ترجیح می‌دهد..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            <Button type="submit" isLoading={isSavingNotes} className="w-full py-2.5 font-bold text-xs">
              ذخیره یادداشت مشتری
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
