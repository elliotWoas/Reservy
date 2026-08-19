'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [orgSlug, setOrgSlug] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      const result = await ApiClient.request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          organizationName: orgName,
          organizationSlug: orgSlug,
        }),
      });

      ApiClient.setToken(result.token);
      if (result.organization?.id) {
        ApiClient.setActiveOrgId(result.organization.id);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام. لطفاً اطلاعات را بررسی نمایید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 selection:bg-emerald-500 text-white">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
              R
            </div>
            <span className="text-2xl font-black tracking-tight text-white">رزِروی</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-100">ثبت‌نام و راه‌اندازی کسب‌وکار</h1>
          <p className="text-xs text-slate-400">کسب‌وکار خود را در کمتر از ۱ دقیقه آنلاین کنید</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl text-right">
          <Input
            label="نام و نام خانوادگی مدیر"
            required
            placeholder="مثال: سارا محمدی"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="نام کسب‌وکار یا مجموعه"
            required
            placeholder="مثال: کلینیک دندانپزشکی مهر"
            value={orgName}
            onChange={(e) => {
              setOrgName(e.target.value);
              // Auto-suggest slug if empty
              if (!orgSlug) {
                const auto = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                if (auto) setOrgSlug(auto);
              }
            }}
          />

          <Input
            label="شناسه آدرس اینترنتی (Slug انگلیسی)"
            required
            placeholder="mehr-clinic"
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
            helperText="آدرس صفحه رزرو شما: reservy.ir/your-slug"
          />

          <Input
            label="شماره موبایل مدیر"
            type="tel"
            required
            placeholder="۰۹۱۲۱۲۳۴۵۶۷"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="ایمیل"
            type="email"
            required
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="رمز عبور"
            type="password"
            required
            placeholder="حداقل ۶ کاراکتر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full py-3 text-sm font-bold mt-2">
            ثبت‌نام و ورود به پنل
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
              قبلاً ثبت‌نام کرده‌اید؟ <span className="font-bold text-emerald-400">ورود به حساب</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
