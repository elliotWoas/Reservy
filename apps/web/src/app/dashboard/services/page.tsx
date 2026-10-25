'use client';

import React, { useState, useEffect } from 'react';
import { Scissors, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ApiClient } from '@/lib/api-client';
import { formatToman } from '@/lib/utils';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [price, setPrice] = useState<number>(300000);
  const [bufferBefore, setBufferBefore] = useState<number>(0);
  const [bufferAfter, setBufferAfter] = useState<number>(5);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [catName, setCatName] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([
        ApiClient.request<any[]>('/catalog/services'),
        ApiClient.request<any[]>('/catalog/categories'),
      ]);
      setServices(sRes || []);
      setCategories(cRes || []);
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingServiceId(null);
    setName('');
    setDescription('');
    setCategoryId('');
    setDurationMinutes(45);
    setPrice(300000);
    setBufferBefore(0);
    setBufferAfter(5);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingServiceId(s.id);
    setName(s.name);
    setDescription(s.description || '');
    setCategoryId(s.categoryId || '');
    setDurationMinutes(s.durationMinutes);
    setPrice(s.price);
    setBufferBefore(s.bufferBeforeMinutes || 0);
    setBufferAfter(s.bufferAfterMinutes || 0);
    setIsModalOpen(false);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        name,
        description: description || undefined,
        categoryId: categoryId || undefined,
        durationMinutes: Number(durationMinutes),
        price: Number(price),
        bufferBeforeMinutes: Number(bufferBefore),
        bufferAfterMinutes: Number(bufferAfter),
      };

      if (editingServiceId) {
        await ApiClient.request(`/catalog/services/${editingServiceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await ApiClient.request('/catalog/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      setEditingServiceId(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره خدمت');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('آیا از حذف این خدمت اطمینان دارید؟')) return;
    try {
      await ApiClient.request(`/catalog/services/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در حذف خدمت');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await ApiClient.request('/catalog/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName }),
      });
      setIsCatModalOpen(false);
      setCatName('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در ایجاد دسته‌بندی');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100">مدیریت خدمات و قیمت‌گذاری</h1>
          <p className="text-xs text-slate-500">تعریف خدمات قابل رزرو، مدت زمان و قیمت‌ها</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsCatModalOpen(true)}>
            دسته‌بندی جدید
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>افزودن خدمت جدید</span>
          </Button>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center text-xs text-slate-400">در حال بارگذاری لیست خدمات...</Card>
        ) : services.length === 0 ? (
          <EmptyState
            title="هیچ خدمتی ثبت نشده است"
            description="برای شروع نوبت‌دهی آنلاین، حداقل یک خدمت تعریف فرمایید."
            icon={Scissors}
            action={<Button size="sm" onClick={handleOpenAdd}>تعریف اولین خدمت</Button>}
          />
        ) : services.map((s) => (
          <div key={s.id} className="space-y-2">
            <Card className="p-4 sm:p-5 border-white/10 bg-surface/90">
              <div className="flex flex-row-reverse items-start gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteService(s.id)}
                    aria-label={`حذف ${s.name}`}
                    className="w-10 h-10 rounded-xl border border-rose-400/15 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editingServiceId === s.id ? setEditingServiceId(null) : handleOpenEdit(s)}
                    aria-label={`ویرایش ${s.name}`}
                    aria-expanded={editingServiceId === s.id}
                    className={`w-10 h-10 rounded-xl border transition-colors flex items-center justify-center ${
                      editingServiceId === s.id
                        ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                        : 'border-emerald-400/15 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <h2 className="text-sm font-extrabold text-slate-100">{s.name}</h2>
                  <p className="mt-1 text-xs font-bold text-emerald-300">{formatToman(s.price)} ریال</p>
                  {s.description && <p className="mt-2 text-[11px] leading-6 text-slate-400 line-clamp-2">{s.description}</p>}
                  <div className="mt-2 flex flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] text-slate-500">
                    <span>{s.durationMinutes} دقیقه</span>
                    <span>{s.category?.name || 'بدون دسته‌بندی'}</span>
                    {(s.bufferBeforeMinutes || s.bufferAfterMinutes) > 0 && (
                      <span>بافر {s.bufferBeforeMinutes || 0} قبل / {s.bufferAfterMinutes || 0} بعد</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {editingServiceId === s.id && (
              <Card className="p-4 sm:p-5 border-white/10 bg-surface/95 animate-fade-in">
                <form onSubmit={handleSaveService} className="space-y-4">
                  <div className="space-y-1 border-b border-white/10 pb-3">
                    <h3 className="text-sm font-black text-slate-100">ویرایش خدمت: {s.name}</h3>
                    <p className="text-[11px] leading-5 text-slate-400">قیمت و زمان جدید فقط برای رزروهای جدید اعمال می‌شود.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={`service-name-${s.id}`} className="block text-xs font-bold text-slate-300">نام خدمت</label>
                    <input id={`service-name-${s.id}`} required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-inset px-4 py-3 text-xs text-slate-100 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/10" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-300">مدت خدمت</label>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-inset px-3 py-2 text-slate-200">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {Math.floor(durationMinutes / 60) > 0 ? `${Math.floor(durationMinutes / 60)} ساعت و ` : ''}{durationMinutes % 60 ? `${durationMinutes % 60} دقیقه` : '۰ دقیقه'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">ساعت</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map((hours) => (
                        <button key={hours} type="button" onClick={() => setDurationMinutes(Math.max(5, hours * 60 + durationMinutes % 60))} className={`rounded-xl border py-2 text-xs transition ${Math.floor(durationMinutes / 60) === hours ? 'border-amber-400/50 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-inset text-slate-400 hover:border-white/20'}`}>{hours}</button>
                      ))}
                    </div>
                    <p className="pt-1 text-[10px] text-slate-500">دقیقه</p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                      {[0, 5, 10, 15, 20, 25, 30, 45].map((minutes) => (
                        <button key={minutes} type="button" onClick={() => setDurationMinutes(Math.max(5, Math.floor(durationMinutes / 60) * 60 + minutes))} className={`rounded-xl border py-2 text-xs transition ${durationMinutes % 60 === minutes ? 'border-amber-400/50 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-inset text-slate-400 hover:border-white/20'}`}>{minutes}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={`service-price-${s.id}`} className="block text-xs font-bold text-slate-300">قیمت</label>
                    <div className="flex items-center rounded-xl border border-white/10 bg-inset px-4 focus-within:border-amber-400/50">
                      <input id={`service-price-${s.id}`} type="number" min={0} step={1000} required value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full bg-transparent py-3 text-xs text-slate-100 outline-none" />
                      <span className="text-[10px] text-slate-500">ریال</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-300">یک بار مصرف و شفاف؛ بدون هزینه پنهان</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={`service-description-${s.id}`} className="block text-xs font-bold text-slate-300">توضیحات خدمت (اختیاری)</label>
                    <textarea id={`service-description-${s.id}`} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-y rounded-xl border border-white/10 bg-inset px-4 py-3 text-xs leading-6 text-slate-100 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/10" />
                  </div>

                  <details className="rounded-xl border border-white/10 bg-inset px-4 py-3">
                    <summary className="cursor-pointer text-xs font-bold text-slate-300">تنظیمات تکمیلی</summary>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <select aria-label="دسته‌بندی خدمت" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-xs text-slate-200">
                        <option value="">بدون دسته‌بندی</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <label className="space-y-1 text-[10px] text-slate-400">بافر قبل (دقیقه)<input type="number" min={0} value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs text-slate-100" /></label>
                      <label className="space-y-1 text-[10px] text-slate-400">بافر بعد (دقیقه)<input type="number" min={0} value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-xs text-slate-100" /></label>
                    </div>
                  </details>

                  <p className="text-[10px] leading-5 text-slate-500">قیمت یا زمان خدمت ممکن است تغییر کند؛ لطفاً برای هماهنگی با مشتری پیش از رزرو بررسی کنید.</p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => setEditingServiceId(null)} className="sm:min-w-24">انصراف</Button>
                    <Button type="submit" isLoading={isSaving} className="sm:min-w-40">ذخیره تغییرات</Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="افزودن خدمت جدید"
        maxWidth="md"
      >
        <form onSubmit={handleSaveService} className="space-y-4">
          <Input
            label="نام خدمت"
            required
            placeholder="مثال: اصلاح و استایل مو"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">دسته‌بندی:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-inset border border-white/10 text-slate-100"
            >
              <option value="">بدون دسته‌بندی</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="مدت زمان (دقیقه)"
              type="number"
              required
              min={5}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
            <Input
              label="قیمت (تومان)"
              type="number"
              required
              min={0}
              step={1000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="بافر قبل (دقیقه)"
              type="number"
              min={0}
              value={bufferBefore}
              onChange={(e) => setBufferBefore(Number(e.target.value))}
            />
            <Input
              label="بافر بعد (دقیقه)"
              type="number"
              min={0}
              value={bufferAfter}
              onChange={(e) => setBufferAfter(Number(e.target.value))}
            />
          </div>

          <Input
            label="توضیحات تکمیلی (اختیاری)"
            placeholder="شرح جزئیات خدمت برای مشتری..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button type="submit" isLoading={isSaving} className="w-full py-2.5 font-bold text-xs mt-2">
            ذخیره خدمت
          </Button>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="افزودن دسته‌بندی جدید"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="عنوان دسته‌بندی"
            required
            placeholder="مثال: خدمات VIP، پوست، مو..."
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <Button type="submit" className="w-full py-2.5 font-bold text-xs">
            ایجاد دسته‌بندی
          </Button>
        </form>
      </Modal>
    </div>
  );
}
