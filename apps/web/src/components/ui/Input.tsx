import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-right">
        {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-colors duration-200',
            'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600',
            'disabled:opacity-50 disabled:bg-slate-50',
            error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-600',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
