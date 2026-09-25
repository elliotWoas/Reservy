'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TouchEvent, MouseEvent } from 'react';
import { Columns2, Sliders, Sparkles } from 'lucide-react';

interface ComparisonSliderProps {
  originalImage: string;
  generatedImage: string;
  hairstyleName: string;
  persianName: string;
}

export function ComparisonSlider({
  originalImage,
  generatedImage,
  hairstyleName,
  persianName,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      handleMove(e.touches[0].clientX);
    },
    [handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-4 select-none">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/60 border border-amber-500/20 text-xs">
        <button
          type="button"
          onClick={() => setViewMode('slider')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            viewMode === 'slider'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>اسلایدر قبل و بعد</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('side-by-side')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
            viewMode === 'side-by-side'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>نمای کنار هم</span>
        </button>
      </div>

      {viewMode === 'slider' ? (
        /* Slider Mode */
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onTouchMove={handleTouchMove}
          className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 cursor-ew-resize touch-none bg-slate-950"
        >
          {/* Generated Image (Right layer / Base) */}
          <img
            src={generatedImage}
            alt={hairstyleName}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Original Image (Left layer / Clipped) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImage}
              alt="عکس اولیه"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                height: containerRef.current ? `${containerRef.current.clientHeight}px` : '100%',
              }}
            />
          </div>

          {/* Draggable Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Center Handle Knob */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-500 border-2 border-slate-950 shadow-xl flex items-center justify-center text-slate-950 font-black text-xs">
              ↔
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مدل جدید: {persianName}</span>
          </div>
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-slate-300 text-xs font-bold border border-white/10">
            عکس اولیه شما
          </div>

          <div className="absolute bottom-3 inset-x-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-300 text-[11px] font-medium border border-amber-500/20">
              انگشت یا ماوس را به چپ و راست بکشید
            </span>
          </div>
        </div>
      ) : (
        /* Side-by-Side Mode */
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
            <img src={originalImage} alt="قبل" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-slate-300 text-xs font-bold border border-white/10">
              عکس اولیه شما
            </div>
          </div>

          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-slate-950">
            <img src={generatedImage} alt={hairstyleName} className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-xs font-black shadow-lg flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{persianName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
