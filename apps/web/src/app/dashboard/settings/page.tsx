'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, CreditCard, Building2, ExternalLink, Check, Copy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Profile Form
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Bank Card Form
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolderName, setCardHolderName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [isSavingCard, setIsSavingCard] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.request<any>('/organizations/current');
      setOrg(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setPhone(data.phone || '');
      setLogoUrl(data.logoUrl || '');
      setCoverUrl(data.coverUrl || '');

      const activeCard = data.cardAccounts?.[0];
      if (activeCard) {
        setCardNumber(activeCard.cardNumber || '');
        setCardHolderName(activeCard.cardHolderName || '');
        setBankName(activeCard.bankName || '');
      }
    } catch (err) {
      console.error('Failed to load organization settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await ApiClient.request('/organizations/current', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          phone,
          logoUrl: logoUrl || undefined,
          coverUrl: coverUrl || undefined,
        }),
      });
      alert('اطلاعات کسب‌وکار با موفقیت به‌روزرسانی شد');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره اطلاعات');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingCard(true);
      await ApiClient.request('/organizations/card-accounts', {
        method: 'POST',
        body: JSON.stringify({
          cardNumber,
          cardHolderName,
          bankName: bankName || undefined,
          isActive: true,
        }),
      });
      alert('حساب کارت‌به‌کارت با موفقیت ذخیره شد');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره حساب کارت');
    } finally {
      setIsSavingCard(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">در حال بارگذاری تنظیمات...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in text-right">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">تنظیمات کسب‌وکار</h1>
        <p className="text-xs text-slate-500">اطلاعات برندینگ و حساب بانکی جهت دریافت پرداخت‌های کارت‌به‌کارت</p>
      </div>

      {/* Public URL Box */}
      <Card className="p-4 bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs text-emerald-300 font-bold block">آدرس صفحه رزرو عمومی شما:</span>
          <span className="font-mono text-sm tracking-wider text-white" dir="ltr">
            http://localhost:3000/{org?.slug}
          </span>
        </div>
        <Link
          href={`/${org?.slug}`}
          target="_blank"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
        >
          <span>مشاهده صفحه رزرو</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">اطلاعات عمومی کسب‌وکار</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="نام کسب‌وکار"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="شماره تماس کسب‌وکار"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="توضیحات کوتاه (درباره مجموعه)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Input
              label="آدرس لوگو (URL)"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />

            <Input
              label="آدرس کاور بنر (URL)"
              placeholder="https://..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />

            <Button type="submit" isLoading={isSavingProfile} className="w-full py-2.5 font-bold text-xs">
              ذخیره تغییرات کسب‌وکار
            </Button>
          </form>
        </Card>

        {/* Bank Card Account Settings */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">تنظیمات حساب کارت‌به‌کارت</h3>
              <p className="text-[11px] text-slate-500">شماره کارتی که در مرحله پرداخت به مشتریان نمایش داده می‌شود</p>
            </div>
          </div>

          <form onSubmit={handleSaveCard} className="space-y-4">
            <Input
              label="شماره کارت ۱۶ رقمی"
              required
              maxLength={16}
              placeholder="۶۰۳۷۹۹۷۱۲۳۴۵۶۷۸۹"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
              helperText="فقط ۱۶ رقم شماره کارت بدون فاصله یا خط تیره"
            />

            <Input
              label="نام و نام خانوادگی صاحب کارت"
              required
              placeholder="مثال: امیرحسین رضایی"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
            />

            <Input
              label="نام بانک (اختیاری)"
              placeholder="مثال: بانک ملی، بانک ملت..."
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />

            <Button type="submit" isLoading={isSavingCard} className="w-full py-2.5 font-bold text-xs">
              ذخیره حساب کارت بانکی
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
