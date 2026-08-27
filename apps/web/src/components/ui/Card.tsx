import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-[#111726]/90 backdrop-blur-xl border border-amber-500/15 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:border-amber-500/30 transition-all duration-200 text-slate-100',
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
    <Card className={cn('flex items-center justify-between p-5 relative overflow-hidden group bg-[#111726]/90 border-amber-500/15 hover:border-amber-500/30', className)}>
      <div className="space-y-1 text-right relative z-10">
        <p className="text-xs font-bold text-slate-400">{title}</p>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-amber-400/80 font-medium">{subtitle}</p>}
      </div>
      <div className="p-3.5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 rounded-2xl shadow-xs border border-amber-500/30 group-hover:scale-105 group-hover:bg-amber-500/30 transition-all duration-200">
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
    <div className="text-center py-12 px-6 border-2 border-dashed border-amber-500/15 rounded-3xl bg-[#0E131F]/50">
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-3.5 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs text-amber-400">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h4 className="text-sm font-extrabold text-slate-200">{title}</h4>
      {description && (
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
