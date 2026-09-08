'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Scissors,
    User,
    Clock,
    Briefcase,
    Star,
    Sparkles,
    Info,
    CalendarCheck,
} from 'lucide-react';
import { formatToman } from '@/lib/utils';

interface StorefrontTabsProps {
    org: any;
    primaryLocation: any;
}

export default function StorefrontTabs({ org, primaryLocation }: StorefrontTabsProps) {
    // استخراج خودکار دسته‌بندی‌های خدمات
    const serviceCategories = useMemo(() => {
        const cats: { id: string; name: string }[] = [{ id: 'all', name: 'همه خدمات' }];
        org.services?.forEach((s: any) => {
            if (s.category && !cats.some((c) => c.id === s.category.id)) {
                cats.push({ id: s.category.id, name: s.category.name });
            }
        });
        return cats;
    }, [org.services]);

    const [activeTab, setActiveTab] = useState<string>('services');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // فیلتر خدمات بر اساس زیرکتگوری
    const filteredServices = useMemo(() => {
        if (selectedCategory === 'all') return org.services || [];
        return (org.services || []).filter((s: any) => s.category?.id === selectedCategory);
    }, [org.services, selectedCategory]);

    const MAIN_TABS = [
        { id: 'services', label: 'خدمات و تعرفه', icon: Scissors, count: org.services?.length },
        { id: 'staff', label: 'متخصصین', icon: User, count: org.staffMembers?.length },
        { id: 'about', label: 'درباره و تماس', icon: Info },
        { id: 'reviews', label: 'نظرات مشتریان', icon: Star },
        { id: 'portfolio', label: 'نمونه‌کارها', icon: Sparkles },
    ];

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* ۱. نوار تب‌های اصلی (Scrollable Horizontal Bar) */}
            <div className="flex items-center gap-1 sm:gap-2 px-1 border-b border-slate-100 overflow-x-auto scrollbar-none bg-slate-50/50">
                {MAIN_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative py-2.5 px-3 min-w-[64px] flex flex-col items-center justify-center gap-1 text-[11px] font-bold whitespace-nowrap transition-all ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                {typeof tab.count === 'number' && (
                                    <span
                                        className={`absolute -top-1.5 -left-2 text-[9px] px-1 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                            }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </div>
                            <span>{tab.label}</span>
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ۲. محتوای هر تب */}
            <div className="p-4 sm:p-3">
                {/* تب خدمات */}
                {activeTab === 'services' && (
                    <div className="space-y-3">
                        {/* چیپ‌های فیلتر دسته‌بندی زیرمجموعه خدمات */}
                        {serviceCategories.length > 1 && (
                            <div className="flex items-center gap-1 px-2 border-b border-slate-100 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-slate-50/50">
                                {serviceCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id
                                                ? 'bg-green-500 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* لیست کارت‌های خدمات */}
                        <div className="space-y-3">
                            {filteredServices.map((service: any) => (
                                <div
                                    key={service.id}
                                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
                                            {service.category && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-[10px] font-semibold">
                                                    {service.category.name}
                                                </span>
                                            )}
                                        </div>
                                        {service.description && (
                                            <p className="text-xs text-slate-500 leading-relaxed max-w-lg">{service.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{service.durationMinutes} دقیقه</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                                        <span className="text-sm font-black text-emerald-600">
                                            {formatToman(service.price)}
                                        </span>
                                        <Link
                                            href={`/book/${org.slug}?serviceId=${service.id}`}
                                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-sm"
                                        >
                                            انتخاب و رزرو
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {filteredServices.length === 0 && (
                                <div className="text-center py-12 text-xs text-slate-400">
                                    هیچ خدمتی در این دسته‌بندی یافت نشد.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* تب متخصصین */}
                {activeTab === 'staff' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {org.staffMembers?.map((staff: any) => (
                            <div
                                key={staff.id}
                                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all shadow-sm flex items-center gap-3.5"
                            >
                                {staff.avatarUrl ? (
                                    <img
                                        src={staff.avatarUrl}
                                        alt={staff.displayName}
                                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                                        {staff.displayName.charAt(0)}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-slate-900">{staff.displayName}</h4>
                                    <p className="text-[11px] text-slate-500 line-clamp-2">{staff.bio || 'متخصص باتجربه'}</p>
                                </div>
                            </div>
                        ))}
                        {(!org.staffMembers || org.staffMembers.length === 0) && (
                            <div className="col-span-2 text-center py-12 text-xs text-slate-400">
                                اطلاعات متخصصی ثبت نشده است.
                            </div>
                        )}
                    </div>
                )}

                {/* تب درباره مجموعه */}
                {activeTab === 'about' && (
                    <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                        <h4 className="text-sm font-bold text-slate-900">درباره {org.name}</h4>
                        <p>{org.description || 'توضیحاتی برای این مجموعه ثبت نشده است.'}</p>
                        {primaryLocation?.address && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="font-bold text-slate-800 block mb-1">نشانی:</span>
                                <span>{primaryLocation.address}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* تب‌های خالی نمونه‌کار و نظرات */}
                {(activeTab === 'reviews' || activeTab === 'portfolio') && (
                    <div className="text-center py-16">
                        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">این بخش به‌زودی فعال خواهد شد.</p>
                    </div>
                )}
            </div>
        </div>
    );
}