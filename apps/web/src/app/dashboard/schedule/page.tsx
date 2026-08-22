'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Sparkles, Check, Calendar, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

export default function WorkingHoursQuickSetupPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Quick Preset State
  const [workStart, setWorkStart] = useState<string>('10:00');
  const [workEnd, setWorkEnd] = useState<string>('20:00');
  const [break1Start, setBreak1Start] = useState<string>('13:00');
  const [break1End, setBreak1End] = useState<string>('14:00');
  const [break2Start, setBreak2Start] = useState<string>('17:00');
  const [break2End, setBreak2End] = useState<string>('17:30');
  const [hasBreak2, setHasBreak2] = useState<boolean>(false);
  const [slotDuration, setSlotDuration] = useState<number>(45); // 45 minutes default
  const [isFridayOff, setIsFridayOff] = useState<boolean>(true);

  // Generated Preview Slots
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);

  useEffect(() => {
    async function loadStaff() {
      try {
        setLoading(true);
        const data = await ApiClient.request<any[]>('/catalog/staff');
        setStaffList(data || []);
        if (data && data.length > 0) {
          setSelectedStaffId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load staff', err);
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, []);

  // Calculate preview slots whenever hours, breaks, or duration change
  useEffect(() => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const toTimeStr = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const startM = toMinutes(workStart);
    const endM = toMinutes(workEnd);
    const b1StartM = toMinutes(break1Start);
    const b1EndM = toMinutes(break1End);
    const b2StartM = hasBreak2 ? toMinutes(break2Start) : -1;
    const b2EndM = hasBreak2 ? toMinutes(break2End) : -1;

    const slots: string[] = [];
    let cur = startM;

    while (cur + slotDuration <= endM) {
      const slotEnd = cur + slotDuration;
      const overlapsB1 = Math.max(cur, b1StartM) < Math.min(slotEnd, b1EndM);
      const overlapsB2 = hasBreak2 && Math.max(cur, b2StartM) < Math.min(slotEnd, b2EndM);

      if (!overlapsB1 && !overlapsB2) {
        slots.push(`${toTimeStr(cur)} تا ${toTimeStr(slotEnd)}`);
      }
      cur += slotDuration;
    }

    setPreviewSlots(slots);
  }, [workStart, workEnd, break1Start, break1End, break2Start, break2End, hasBreak2, slotDuration]);

  // Apply to all days for selected staff or all staff
  const handleApplySchedule = async () => {
    if (!selectedStaffId) return;

    try {
      setIsSaving(true);

      const breaks = [{ startTime: break1Start, endTime: break1End }];
      if (hasBreak2) {
        breaks.push({ startTime: break2Start, endTime: break2End });
      }

      const schedules = WEEKDAYS.map((w) => {
        const isOff = isFridayOff && w.day === 6;
        return {
          dayOfWeek: w.day,
          shifts: isOff ? [] : [{ startTime: workStart, endTime: workEnd }],
          breaks: isOff ? [] : breaks,
          isDayOff: isOff,
        };
      });

      await ApiClient.request(`/availability/staff/${selectedStaffId}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({ schedules }),
      });

      alert('ساعات کاری و سانس‌بندی با موفقیت روی تمام روزهای هفته اعمال شد!');
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره برنامه کاری');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in text-right">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">تنظیم سریع ساعات کاری و بلوک‌های رزرو (سانس‌بندی)</h1>
        <p className="text-xs text-slate-500 mt-1">
          ساعت شروع و پایان کار، زمان‌های استراحت و مدت زمان هر نوبت (مثلاً ۴۵ دقیقه) را تعیین کنید تا کل روز به صورت خودکار به بلوک‌های خالی تبدیل شود.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-6">
            {/* Staff Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">انتخاب ارائه‌دهنده / آرایشگر:</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* 1. Working Hours Range */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">۱. بازه ساعت کاری روزانه</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="از ساعت (شروع کار صبح)"
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                />
                <Input
                  label="تا ساعت (پایان کار شب)"
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Break Times */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900">۲. زمان‌های استراحت / ناهار (غیرقابل رزرو)</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">استراحت اول (ناهار / استراحت ظهر):</span>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="time"
                      value={break1Start}
                      onChange={(e) => setBreak1Start(e.target.value)}
                    />
                    <Input
                      type="time"
                      value={break1End}
                      onChange={(e) => setBreak1End(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasBreak2}
                      onChange={(e) => setHasBreak2(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600"
                    />
                    <span>افزودن استراحت دوم (عصرانه / چای)</span>
                  </label>
                  {hasBreak2 && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <Input
                        type="time"
                        value={break2Start}
                        onChange={(e) => setBreak2Start(e.target.value)}
                      />
                      <Input
                        type="time"
                        value={break2End}
                        onChange={(e) => setBreak2End(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Slot Duration */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">۳. مدت زمان هر سانس / هر مشتری</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[30, 45, 60, 90].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSlotDuration(dur)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      slotDuration === dur
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {dur} دقیقه
                  </button>
                ))}
              </div>
            </div>

            {/* Friday Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFridayOff}
                  onChange={(e) => setIsFridayOff(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>جمعه‌ها تعطیل باشد</span>
              </label>
            </div>

            {/* Save Button */}
            <Button
              isLoading={isSaving}
              onClick={handleApplySchedule}
              className="w-full py-3.5 text-sm font-bold mt-4 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>اعمال و ذخیره برای تمام روزهای هفته (شنبه تا پنج‌شنبه)</span>
            </Button>
          </Card>
        </div>

        {/* Live Slot Preview Column */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">پیش‌نمایش سانس‌های روزانه</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {previewSlots.length} نوبت در روز
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              مشتریان در صفحه رزرو، سانس‌های خالی زیر را برای انتخاب مشاهده خواهند کرد:
            </p>

            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {previewSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span className="text-emerald-700 font-bold">نوبت {idx + 1}</span>
                  <span className="font-mono text-slate-900">{slot}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
