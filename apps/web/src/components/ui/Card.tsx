import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/70 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn('flex items-center justify-between p-5 relative overflow-hidden group', className)}>
      <div className="space-y-1 text-right relative z-10">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{subtitle}</p>}
      </div>
      <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-emerald-100/70 dark:from-emerald-950/60 dark:to-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-2xl shadow-xs border border-emerald-200/50 group-hover:scale-105 transition-transform duration-200">
        <Icon className="w-5 h-5" />
      </div>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200/80 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40">
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-3.5 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-xs text-slate-400 dark:text-slate-500">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
