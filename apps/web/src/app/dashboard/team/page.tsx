'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Clock, Edit, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ApiClient } from '@/lib/api-client';

const WEEKDAYS = [
  { day: 0, label: 'شنبه' },
  { day: 1, label: 'یکشنبه' },
  { day: 2, label: 'دوشنبه' },
  { day: 3, label: 'سه‌شنبه' },
  { day: 4, label: 'چهارشنبه' },
  { day: 5, label: 'پنج‌شنبه' },
  { day: 6, label: 'جمعه' },
];

export default function TeamPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleStaff, setScheduleStaff] = useState<any>(null);
  const [weekSchedules, setWeekSchedules] = useState<any[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, servicesRes] = await Promise.all([
        ApiClient.request<any[]>('/catalog/staff'),
        ApiClient.request<any[]>('/catalog/services'),
      ]);
      setStaffList(staffRes || []);
      setServicesList(servicesRes || []);
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setDisplayName('');
    setBio('');
    setAvatarUrl('');
    setPhone('');
    setSelectedServiceIds([]);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (st: any) => {
    setEditingStaffId(st.id);
    setDisplayName(st.displayName);
    setBio(st.bio || '');
    setAvatarUrl(st.avatarUrl || '');
    setPhone(st.phone || '');
    setSelectedServiceIds(st.staffServices?.map((ss: any) => ss.serviceId) || []);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        displayName,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        phone: phone || undefined,
        serviceIds: selectedServiceIds,
      };

      if (editingStaffId) {
        await ApiClient.request(`/catalog/staff/${editingStaffId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await ApiClient.request('/catalog/staff', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsStaffModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره ارائه‌دهنده');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSchedule = async (st: any) => {
    setScheduleStaff(st);
    try {
      const data = await ApiClient.request<any[]>(`/availability/staff/${st.id}/schedule`);
      // Prepare 7 days
      const days = WEEKDAYS.map((w) => {
        const found = data.find((d: any) => d.dayOfWeek === w.day);
        const shifts = found ? JSON.parse(found.shiftsJson || '[]') : [{ startTime: '10:00', endTime: '20:00' }];
        const breaks = found ? JSON.parse(found.breaksJson || '[]') : [{ startTime: '14:00', endTime: '15:00' }];
        const isDayOff = found ? found.isDayOff : w.day === 6;

        return {
          dayOfWeek: w.day,
          label: w.label,
          shifts,
          breaks,
          isDayOff,
        };
      });
      setWeekSchedules(days);
      setIsScheduleModalOpen(true);
    } catch (err) {
      alert('خطا در دریافت برنامه کاری');
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleStaff) return;
    try {
      setIsSavingSchedule(true);
      await ApiClient.request(`/availability/staff/${scheduleStaff.id}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({ schedules: weekSchedules }),
      });
      setIsScheduleModalOpen(false);
      alert('ساعات کاری با موفقیت به‌روزرسانی شد');
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره ساعات کاری');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">تیم، ارائه‌دهندگان و ساعات کاری</h1>
          <p className="text-xs text-slate-500">مدیریت پرسنل، خدمات اختصاصی و برنامه شیفت‌های هفتگی</p>
        </div>

        <Button size="sm" onClick={handleOpenAddStaff} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>افزودن عضو جدید</span>
        </Button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">در حال بارگذاری لیست تیم...</div>
      ) : staffList.length === 0 ? (
        <EmptyState
          title="هیچ ارائه‌دهنده‌ای ثبت نشده است"
          description="حداقل یک ارائه‌دهنده برای انتساب خدمات و زمان‌بندی تعریف فرمایید."
          icon={UserCheck}
          action={<Button size="sm" onClick={handleOpenAddStaff}>افزودن اولین ارائه‌دهنده</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map((st) => (
            <Card key={st.id} className="p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                {st.avatarUrl ? (
                  <img src={st.avatarUrl} alt={st.displayName} className="w-14 h-14 rounded-2xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                    {st.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{st.displayName}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{st.bio || 'متخصص'}</p>
                </div>
              </div>

              {/* Services assigned */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">خدمات ارائه شونده:</span>
                <div className="flex flex-wrap gap-1.5">
                  {st.staffServices?.length > 0 ? (
                    st.staffServices.map((ss: any) => (
                      <span key={ss.serviceId} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {ss.service?.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400">تمام خدمات (پیش‌فرض)</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenSchedule(st)}
                  className="text-[11px] py-1.5"
                >
                  <Clock className="w-3.5 h-3.5 ml-1" />
                  <span>تنظیم ساعات کاری</span>
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditStaff(st)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Modal */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={editingStaffId ? 'ویرایش ارائه‌دهنده' : 'افزودن ارائه‌دهنده جدید'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <Input
            label="نام و نام خانوادگی"
            required
            placeholder="مثال: علی رضایی"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input
            label="شماره موبایل (جهت هماهنگی)"
            type="tel"
            placeholder="۰۹۱۲۰۰۰۰۰۰۰"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="توضیحات کوتاه / تخصص"
            placeholder="مثال: مستر باربر با ۸ سال تجربه..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <Input
            label="آدرس تصویر آواتار (URL)"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />

          {/* Multi-select Services */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">انتساب خدمات قابل رزرو:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl">
              {servicesList.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServiceIds([...selectedServiceIds, s.id]);
                        } else {
                          setSelectedServiceIds(selectedServiceIds.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{s.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" isLoading={isSaving} className="w-full py-2.5 font-bold text-xs mt-2">
            ذخیره اطلاعات
          </Button>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`برنامه کاری هفتگی ${scheduleStaff?.displayName || ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-3">
            {weekSchedules.map((day, idx) => (
              <div
                key={day.dayOfWeek}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  day.isDayOff ? 'bg-slate-50/50 border-slate-200 opacity-60' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 w-28">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={!day.isDayOff}
                      onChange={(e) => {
                        const updated = [...weekSchedules];
                        updated[idx].isDayOff = !e.target.checked;
                        setWeekSchedules(updated);
                      }}
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>{day.label}</span>
                  </label>
                </div>

                {!day.isDayOff ? (
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">شیفت:</span>
                      <input
                        type="time"
                        value={day.shifts[0]?.startTime || '10:00'}
                        onChange={(e) => {
                          const updated = [...weekSchedules];
                          updated[idx].shifts[0].startTime = e.target.value;
                          setWeekSchedules(updated);
                        }}
                        className="px-2 py-1 bg-slate-50 border rounded-lg"
                      />
                      <span>تا</span>
                      <input
                        type="time"
                        value={day.shifts[0]?.endTime || '20:00'}
                        onChange={(e) => {
                          const updated = [...weekSchedules];
                          updated[idx].shifts[0].endTime = e.target.value;
                          setWeekSchedules(updated);
                        }}
                        className="px-2 py-1 bg-slate-50 border rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      <span>استراحت:</span>
                      <input
                        type="time"
                        value={day.breaks[0]?.startTime || '14:00'}
                        onChange={(e) => {
                          const updated = [...weekSchedules];
                          if (!updated[idx].breaks[0]) updated[idx].breaks[0] = { startTime: '14:00', endTime: '15:00' };
                          updated[idx].breaks[0].startTime = e.target.value;
                          setWeekSchedules(updated);
                        }}
                        className="px-2 py-1 bg-slate-50 border rounded-lg"
                      />
                      <span>تا</span>
                      <input
                        type="time"
                        value={day.breaks[0]?.endTime || '15:00'}
                        onChange={(e) => {
                          const updated = [...weekSchedules];
                          if (!updated[idx].breaks[0]) updated[idx].breaks[0] = { startTime: '14:00', endTime: '15:00' };
                          updated[idx].breaks[0].endTime = e.target.value;
                          setWeekSchedules(updated);
                        }}
                        className="px-2 py-1 bg-slate-50 border rounded-lg"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-rose-500">تعطیل</span>
                )}
              </div>
            ))}
          </div>

          <Button
            isLoading={isSavingSchedule}
            onClick={handleSaveSchedule}
            className="w-full py-2.5 font-bold text-xs mt-4"
          >
            ذخیره برنامه شیفت هفتگی
          </Button>
        </div>
      </Modal>
    </div>
  );
}
