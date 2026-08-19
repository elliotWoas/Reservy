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
    setIsModalOpen(true);
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
      fetchData();
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
          <h1 className="text-xl font-black text-slate-900">مدیریت خدمات و قیمت‌گذاری</h1>
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
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">در حال بارگذاری لیست خدمات...</div>
        ) : services.length === 0 ? (
          <EmptyState
            title="هیچ خدمتی ثبت نشده است"
            description="برای شروع نوبت‌دهی آنلاین، حداقل یک خدمت تعریف فرمایید."
            icon={Scissors}
            action={<Button size="sm" onClick={handleOpenAdd}>تعریف اولین خدمت</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">عنوان خدمت</th>
                  <th className="p-4">دسته‌بندی</th>
                  <th className="p-4">مدت زمان</th>
                  <th className="p-4">قیمت</th>
                  <th className="p-4">بافر استراحت</th>
                  <th className="p-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      {s.description && <span className="text-[11px] text-slate-500 line-clamp-1">{s.description}</span>}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {s.category?.name || 'بدون دسته‌بندی'}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{s.durationMinutes} دقیقه</td>
                    <td className="p-4 font-black text-emerald-700">{formatToman(s.price)}</td>
                    <td className="p-4 text-slate-500">
                      {s.bufferBeforeMinutes || s.bufferAfterMinutes
                        ? `${s.bufferBeforeMinutes || 0} قبل / ${s.bufferAfterMinutes || 0} بعد`
                        : 'بدون بافر'}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingServiceId ? 'ویرایش خدمت' : 'افزودن خدمت جدید'}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">دسته‌بندی:</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800"
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
