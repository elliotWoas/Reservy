'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';
import { formatToman, formatJalaliDate, formatTimeFa } from '@/lib/utils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('PROOF_SUBMITTED');

  // Review Modal State
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let url = '/payments?limit=100';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await ApiClient.request<any>(url);
      const list = Array.isArray(res) ? res : res?.data || [];
      setPayments(list);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!selectedPayment) return;
    try {
      setIsProcessing(true);
      await ApiClient.request(`/payments/${selectedPayment.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ reviewStatus: 'APPROVED' }),
      });
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || 'خطا در تایید پرداخت');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !rejectionReason) return;
    try {
      setIsProcessing(true);
      await ApiClient.request(`/payments/${selectedPayment.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          reviewStatus: 'REJECTED',
          rejectionReason,
        }),
      });
      setIsRejectModalOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (err: any) {
      alert(err.message || 'خطا در رد پرداخت');
    } finally {
      setIsProcessing(false);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#172033] via-[#111726] to-[#172033] p-6 rounded-3xl border border-amber-500/20 shadow-luxury-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">بررسی و تایید پرداخت‌ها</h1>
              <p className="text-xs text-slate-400 mt-0.5">رسیدهای واریز کارت‌به‌کارت ارسال شده توسط مشتریان</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-[#0E131F] p-1.5 rounded-2xl border border-amber-500/15">
          <button
            onClick={() => setStatusFilter('PROOF_SUBMITTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'PROOF_SUBMITTED' ? 'bg-amber-500 text-slate-950 shadow-luxury-sm font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            نیازمند بررسی
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'VERIFIED' ? 'bg-amber-500 text-slate-950 shadow-luxury-sm font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            تایید شده
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'REJECTED' ? 'bg-amber-500 text-slate-950 shadow-luxury-sm font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            رد شده
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === '' ? 'bg-amber-500 text-slate-950 shadow-luxury-sm font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            همه
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <Card className="p-0 overflow-hidden border-amber-500/15 bg-[#111726]/90">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">در حال دریافت لیست پرداخت‌ها...</div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="هیچ پرداختی در این وضعیت وجود ندارد"
            description="رسید جدیدی در صف بررسی نیست."
            icon={CreditCard}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0E131F] border-b border-amber-500/10 text-slate-400 font-bold">
                <tr>
                  <th className="p-4">مشتری</th>
                  <th className="p-4">کد نوبت</th>
                  <th className="p-4">خدمت</th>
                  <th className="p-4">مبلغ واریزی</th>
                  <th className="p-4">زمان ثبت</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-500/10">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">
                      {p.booking?.customer?.fullName || 'مشتری بدون نام'}
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-300">
                      {p.booking?.code || '—'}
                    </td>
                    <td className="p-4 text-slate-300">
                      {p.booking?.service?.name || '—'}
                    </td>
                    <td className="p-4 font-black text-amber-400">
                      {formatToman(p.amount)}
                    </td>
                    <td className="p-4 text-slate-400">
                      {formatJalaliDate(p.createdAt)} ساعت {formatTimeFa(p.createdAt)}
                    </td>
                    <td className="p-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="p-4 text-left">
                      <Button
                        size="sm"
                        variant="goldOutline"
                        onClick={() => setSelectedPayment(p)}
                        className="text-[11px] py-1 px-3"
                      >
                        <Eye className="w-3.5 h-3.5 ml-1" />
                        <span>بررسی فیش</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Payment Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="بررسی رسید واریز کارت‌به‌کارت"
          maxWidth="lg"
        >
          <div className="space-y-6 text-right">
            {/* Info Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#0E131F] p-4 rounded-2xl border border-amber-500/15">
              <div>
                <span className="text-slate-400 block">مشتری:</span>
                <strong className="text-white font-bold text-sm">{selectedPayment.booking?.customer?.fullName}</strong>
                <span className="text-slate-400 block font-mono text-[11px] mt-0.5" dir="ltr">
                  {selectedPayment.booking?.customer?.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">مبلغ واریزی:</span>
                <strong className="text-amber-400 font-black text-sm">{formatToman(selectedPayment.amount)}</strong>
                <span className="text-slate-400 block text-[11px] mt-0.5">کد: {selectedPayment.booking?.code}</span>
              </div>
            </div>

            {/* Proof Image */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">تصویر ارسالی مشتری:</label>
              {selectedPayment.proofs && selectedPayment.proofs.length > 0 ? (
                <div className="border border-amber-500/30 rounded-2xl overflow-hidden bg-black max-h-80 flex items-center justify-center p-2">
                  <img
                    src={
                      selectedPayment.proofs[0].fileUrl.startsWith('http')
                        ? selectedPayment.proofs[0].fileUrl
                        : `${apiBase}${selectedPayment.proofs[0].fileUrl.startsWith('/') ? '' : '/'}${selectedPayment.proofs[0].fileUrl}`
                    }
                    alt="رسید پرداخت"
                    className="max-h-72 object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0E131F] border border-dashed border-slate-700 rounded-2xl text-xs text-slate-400">
                  فایلی پیوست نشده است
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayment(null)}
              >
                بستن
              </Button>

              {selectedPayment.status === 'PROOF_SUBMITTED' && (
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isProcessing}
                  >
                    <XCircle className="w-4 h-4 ml-1" />
                    <span>رد پرداخت</span>
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1" />
                    <span>تایید پرداخت</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal with Reason */}
      {isRejectModalOpen && selectedPayment && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="دلیل رد پرداخت"
        >
          <form onSubmit={handleReject} className="space-y-4 text-right">
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
              دلیل رد شدن رسید به مشتری اطلاع داده خواهد شد تا بتواند مجدداً فیش معتبر ارسال کند.
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">علت رد فیش:</label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: مبلغ واریزی ناخوانا است، شماره حساب اشتباه است..."
                className="w-full p-3 rounded-2xl text-xs bg-[#0E131F] border border-amber-500/20 text-white focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" variant="danger" size="sm" disabled={isProcessing}>
                {isProcessing ? 'در حال ثبت...' : 'تایید رد فیش'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
