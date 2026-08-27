'use client';

import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colorPairs = [
  'bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
  'bg-blue-950/90 text-blue-300 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  'bg-purple-950/90 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
  'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
  'bg-teal-950/90 text-teal-300 border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.15)]',
  'bg-indigo-950/90 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]',
  'bg-cyan-950/90 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
];

export function Avatar({ name = '', src, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-12 h-12 text-base font-black',
    xl: 'w-16 h-16 text-xl font-black',
  };

  // Generate consistent color hash from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colorPairs[Math.abs(hash) % colorPairs.length];

  // Extract initial letter
  const initial = name.trim() ? name.trim().charAt(0) : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-amber-500/30 shadow-md ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center border select-none shrink-0 ${colorClass} ${sizeClasses[size]} ${className}`}
    >
      {initial ? <span>{initial}</span> : <User className="w-1/2 h-1/2" />}
    </div>
  );
}
