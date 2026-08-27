'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, FileText, Phone, Calendar, ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
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
      const list = Array.isArray(res) ? res : res?.data || [];
      setCustomers(list);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#172033] via-[#111726] to-[#172033] p-6 rounded-3xl border border-amber-500/20 shadow-luxury-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">مدیریت مشتریان و پرونده‌ها (CRM)</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                لیست سوابق مراجعات، مجموع دریافتی‌ها و یادداشت‌های اختصاصی هر مشتری
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4 border-amber-500/15 bg-[#111726]/90">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <input
            type="text"
            placeholder="جستجو با نام یا شماره تماس مشتری..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2.5 rounded-2xl text-xs bg-[#0E131F] border border-amber-500/20 text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </form>
      </Card>

      {/* Customers Table */}
      <Card className="p-0 overflow-hidden border-amber-500/15 bg-[#111726]/90">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">در حال بارگذاری پرونده مشتریان...</div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="هیچ مشتری‌ای یافت نشد"
            description="با ثبت اولین نوبت‌ها، پرونده مشتریان به صورت خودکار ایجاد می‌شود."
            icon={Users}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0E131F] border-b border-amber-500/10 text-slate-400 font-bold">
                <tr>
                  <th className="p-4">پروفایل و نام مشتری</th>
                  <th className="p-4">شماره تماس</th>
                  <th className="p-4">تعداد نوبت‌ها</th>
                  <th className="p-4">مجموع خرید</th>
                  <th className="p-4">آخرین مراجعه</th>
                  <th className="p-4">نوبت بعدی</th>
                  <th className="p-4 text-left">یادداشت و پرونده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.fullName || 'مشتری'} size="sm" />
                        <div>
                          <span>{c.fullName}</span>
                          {c.email && <span className="block text-[10px] text-slate-400 font-normal">{c.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-300" dir="ltr">
                      <a href={`tel:${c.phone}`} className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{c.phone}</span>
                      </a>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-200">{formatNumberFa(c.totalBookings)} نوبت</span>
                      <span className="text-[10px] text-slate-400 block">
                        ({formatNumberFa(c.completedBookings)} انجام شده / {formatNumberFa(c.cancelledBookings)} لغو)
                      </span>
                    </td>
                    <td className="p-4 font-black text-amber-400">{formatToman(c.totalSpent)}</td>
                    <td className="p-4 text-slate-300">
                      {c.lastVisit ? formatJalaliDate(c.lastVisit) : '—'}
                    </td>
                    <td className="p-4 text-slate-300">
                      {c.nextBooking ? (
                        <span className="text-emerald-400 font-bold">{formatJalaliDate(c.nextBooking)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 text-left">
                      <Button
                        size="sm"
                        variant="goldOutline"
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

      {/* Notes Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`یادداشت پرونده: ${selectedCustomer.fullName}`}
        >
          <form onSubmit={handleSaveNotes} className="space-y-4 text-right">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0E131F] border border-amber-500/20">
              <Avatar name={selectedCustomer.fullName || 'مشتری'} size="md" />
              <div>
                <span className="font-bold text-white block">{selectedCustomer.fullName}</span>
                <span className="text-xs font-mono text-slate-400" dir="ltr">{selectedCustomer.phone}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                یادداشت‌ها و ترجیحات مشتری (فقط برای مدیریت و پرسنل قابل مشاهده است):
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: حساسیت به رنگ، مدل موی دلخواه، تخفیف اختصاصی..."
                className="w-full p-3.5 rounded-2xl text-xs bg-[#0E131F] border border-amber-500/20 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                انصراف
              </Button>
              <Button type="submit" variant="gold" size="sm" disabled={isSavingNotes}>
                {isSavingNotes ? 'در حال ذخیره...' : 'ذخیره یادداشت'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
