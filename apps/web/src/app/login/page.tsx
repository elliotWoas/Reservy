'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowLeft, Building2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      const result = await ApiClient.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      ApiClient.setToken(result.token);
      if (result.activeOrganizationId) {
        ApiClient.setActiveOrgId(result.activeOrganizationId);
      }

      if (result.user.isSuperAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'ایمیل یا رمز عبور اشتباه است');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'owner' | 'admin') => {
    if (role === 'owner') {
      setEmail('owner@reservy.com');
      setPassword('password123');
    } else {
      setEmail('admin@reservy.com');
      setPassword('password123');
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
          <h1 className="text-xl font-bold text-slate-100">ورود به پنل مدیریت کسب‌وکار</h1>
          <p className="text-xs text-slate-400">اطلاعات حساب کاربری خود را وارد فرمایید</p>
        </div>

        {/* Demo Fast-Login Buttons */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <span className="block text-[11px] font-bold text-slate-400 text-right">ورود سریع با اکانت‌های دمو (توسعه):</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('owner')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-400 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>مدیر کسب‌وکار (Owner)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-purple-950/60 hover:text-purple-400 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>سوپر ادمین (Admin)</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl text-right">
          <Input
            label="ایمیل"
            type="email"
            required
            placeholder="owner@reservy.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="رمز عبور"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} className="w-full py-3 text-sm font-bold mt-2">
            ورود به داشبورد
          </Button>

          <div className="text-center pt-2">
            <Link href="/register" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
              حساب کاربری ندارید؟ <span className="font-bold text-emerald-400">ثبت‌نام کسب‌وکار جدید</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
