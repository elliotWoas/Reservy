import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm',
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
    <Card className={cn('flex items-center justify-between', className)}>
      <div className="space-y-1 text-right">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
      </div>
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
        <Icon className="w-6 h-6" />
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
    <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
      {Icon && (
        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
