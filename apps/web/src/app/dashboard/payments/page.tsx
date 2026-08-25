'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertCircle,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">بررسی و تایید پرداخت‌ها</h1>
          <p className="text-xs text-slate-500">رسیدهای واریز کارت‌به‌کارت ارسال شده توسط مشتریان</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('PROOF_SUBMITTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'PROOF_SUBMITTED' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            نیازمند بررسی
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'VERIFIED' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            تایید شده
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'REJECTED' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            رد شده
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === '' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            همه
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">در حال دریافت لیست پرداخت‌ها...</div>
        ) : payments.length === 0 ? (
          <EmptyState
            title="هیچ پرداختی در این وضعیت وجود ندارد"
            description="رسید جدیدی در صف بررسی نیست."
            icon={CreditCard}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
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
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{p.booking?.customer?.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{p.booking?.customer?.phone}</span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">{p.booking?.code}</td>
                    <td className="p-4 text-slate-700">{p.booking?.service?.name}</td>
                    <td className="p-4 font-black text-emerald-700">{formatToman(p.amount)}</td>
                    <td className="p-4 text-slate-500">{formatJalaliDate(p.createdAt)}</td>
                    <td className="p-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="p-4 text-left">
                      <Button
                        size="sm"
                        variant={p.status === 'PROOF_SUBMITTED' ? 'primary' : 'outline'}
                        onClick={() => setSelectedPayment(p)}
                        className="text-[11px] py-1 px-3"
                      >
                        <Eye className="w-3.5 h-3.5 ml-1" />
                        <span>{p.status === 'PROOF_SUBMITTED' ? 'بررسی رسید' : 'مشاهده'}</span>
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
          isOpen={true}
          onClose={() => setSelectedPayment(null)}
          title="بررسی رسید پرداخت کارت‌به‌کارت"
          maxWidth="lg"
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Booking Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">نام مشتری:</span>
                <span className="font-bold text-slate-900">{selectedPayment.booking?.customer?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">شماره موبایل:</span>
                <span className="font-bold text-slate-900" dir="ltr">{selectedPayment.booking?.customer?.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">کد پیگیری نوبت:</span>
                <span className="font-mono font-bold text-slate-900">{selectedPayment.booking?.code}</span>
              </div>
              <div>
                <span className="text-slate-500 block">مبلغ نوبت:</span>
                <span className="font-black text-emerald-700">{formatToman(selectedPayment.amount)}</span>
              </div>
            </div>

            {/* Receipt Image / Document Preview */}
            <div>
              <span className="block font-semibold text-slate-800 mb-2">تصویر فیش / رسید ارسالی مشتری:</span>
              {selectedPayment.proofs && selectedPayment.proofs.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[350px]">
                  {selectedPayment.proofs[0].mimeType === 'application/pdf' ? (
                    <div className="text-center p-6 text-white space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-emerald-400" />
                      <p>سند PDF رسید بانکی</p>
                      <a
                        href={`${apiBase}${selectedPayment.proofs[0].fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 underline font-bold"
                      >
                        باز کردن و دانلود فایل PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={`${apiBase}${selectedPayment.proofs[0].fileUrl}`}
                      alt="Payment Receipt"
                      className="max-h-[350px] w-auto object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
                  تصویر رسیدی یافت نشد.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedPayment.status === 'PROOF_SUBMITTED' && (
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button
                  isLoading={isProcessing}
                  onClick={handleApprove}
                  className="flex-1 py-2.5 font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 ml-1.5" />
                  <span>تایید پرداخت و قطعی کردن نوبت</span>
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="flex-1 py-2.5 font-bold"
                >
                  <XCircle className="w-4 h-4 ml-1.5" />
                  <span>رد رسید پرداخت</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsRejectModalOpen(false)}
          title="دلیل رد رسید پرداخت"
          maxWidth="sm"
        >
          <form onSubmit={handleReject} className="space-y-4">
            <Input
              label="علت رد رسید (به مشتری نمایش داده می‌شود)"
              required
              placeholder="مثال: تصویر فیش ناخواناست، مبلغ واریزی کسری دارد..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" isLoading={isProcessing} className="flex-1 py-2 text-xs font-bold">
                ثبت رد پرداخت
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)} className="py-2 text-xs">
                انصراف
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
