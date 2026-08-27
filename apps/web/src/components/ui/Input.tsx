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
        {label && <label className="block text-xs font-bold text-slate-300">{label}</label>}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 text-sm bg-[#0E131F] border rounded-2xl shadow-xs transition-all duration-200',
            'border-amber-500/20 text-white placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500',
            'disabled:opacity-50 disabled:bg-slate-900',
            error && 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
