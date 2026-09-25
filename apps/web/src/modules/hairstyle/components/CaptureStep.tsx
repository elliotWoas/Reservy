'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { CaptureAngle, CaptureData, HeadPose, ImageQualityMetrics } from '../types';
import { analyzeCanvasCapture } from '../analysis';
import { CameraOverlay } from './CameraOverlay';
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  RotateCcw,
  AlertCircle,
  SwitchCamera,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CaptureStepProps {
  angle: CaptureAngle;
  onCapture: (data: CaptureData) => void;
  onBack?: () => void;
  initialData?: CaptureData;
  isQuickMode?: boolean;
  onQuickTryOn?: (data: CaptureData) => void;
}

export function CaptureStep({
  angle,
  onCapture,
  onBack,
  initialData,
  isQuickMode = false,
  onQuickTryOn,
}: CaptureStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isLiveActive, setIsLiveActive] = useState(false);

  // Live feedback states
  const [livePose, setLivePose] = useState<HeadPose | undefined>();
  const [liveQuality, setLiveQuality] = useState<ImageQualityMetrics | undefined>();

  // Captured snapshot state
  const [capturedSnapshot, setCapturedSnapshot] = useState<CaptureData | null>(initialData || null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const getAngleLabel = () => {
    if (isQuickMode && angle === 'front') {
      return '⚡ پرو سریع — ثبت تصویر نمای روبرو (Front)';
    }
    switch (angle) {
      case 'front':
        return 'عکس ۱ از ۳ — نمای روبرو (Front)';
      case 'left':
        return 'عکس ۲ از ۳ — نیم‌رخ چپ (Left Profile)';
      case 'right':
        return 'عکس ۳ از ۳ — نیم‌رخ راست (Right Profile)';
    }
  };

  // Start Camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError('دسترسی به دوربین در این مرورگر پشتیبانی نمی‌شود. لطفاً عکس آپلود کنید.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsLiveActive(true);
        };
      }
    } catch (err: any) {
      console.warn('[Camera access error]:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('دسترسی به دوربین توسط کاربر رد شد. می‌توانید از گزینه بارگذاری عکس استفاده فرمایید.');
      } else {
        setCameraError('دوربین در دسترس نیست یا توسط برنامه دیگری اشغال شده است.');
      }
    }
  }, [facingMode]);

  // Stop camera on unmount
  useEffect(() => {
    if (!capturedSnapshot) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera, capturedSnapshot]);

  // Real-time live frame analyzer (scans once every 650ms for performance)
  useEffect(() => {
    if (!isLiveActive || capturedSnapshot) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw mirrored video frame to canvas
      ctx.drawImage(video, 0, 0, 320, 240);
      try {
        const result = analyzeCanvasCapture(canvas, angle);
        setLivePose(result.pose);
        setLiveQuality(result.quality);
      } catch (e) {
        // Ignore live sampling errors
      }
    }, 650);

    return () => clearInterval(interval);
  }, [isLiveActive, capturedSnapshot, angle]);

  // Capture Snapshot from video
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const analysis = analyzeCanvasCapture(canvas, angle);

    const captureData: CaptureData = {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      quality: analysis.quality,
      pose: analysis.pose,
      landmarks: analysis.landmarks,
      geometry: analysis.geometry,
      timestamp: Date.now(),
    };

    setCapturedSnapshot(captureData);

    // Stop camera stream while reviewing
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Set warnings if detection or pose is sub-optimal
    if (!analysis.detected) {
      setValidationWarning('چهره‌ای به صورت واضح در عکس شناسایی نشد.');
    } else if (analysis.pose.angleStatus === 'invalid') {
      setValidationWarning(analysis.pose.feedback);
    } else if (!analysis.quality.isAcceptable) {
      setValidationWarning(analysis.quality.feedback[0]);
    } else {
      setValidationWarning(null);
    }
  };

  // Handle File Upload Fallback
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const analysis = analyzeCanvasCapture(canvas, angle);

        const captureData: CaptureData = {
          dataUrl,
          width: img.width,
          height: img.height,
          quality: analysis.quality,
          pose: analysis.pose,
          landmarks: analysis.landmarks,
          geometry: analysis.geometry,
          timestamp: Date.now(),
        };

        setCapturedSnapshot(captureData);

        if (!analysis.detected) {
          setValidationWarning('چهره‌ای در فایل آپلود شده شناسایی نشد.');
        } else if (analysis.pose.angleStatus === 'invalid') {
          setValidationWarning(analysis.pose.feedback);
        } else {
          setValidationWarning(null);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Retake
  const handleRetake = () => {
    setCapturedSnapshot(null);
    setValidationWarning(null);
    startCamera();
  };

  // Confirm and proceed
  const handleConfirm = () => {
    if (capturedSnapshot) {
      onCapture(capturedSnapshot);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>مرحله قبل</span>
          </button>
        ) : (
          <div />
        )}
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
          {getAngleLabel()}
        </span>
      </div>

      {/* Main Viewport Container */}
      <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
        {capturedSnapshot ? (
          /* Snapshot Review Mode */
          <div className="relative w-full h-full">
            <img
              src={capturedSnapshot.dataUrl}
              alt="عکس گرفته شده"
              className="w-full h-full object-cover"
            />
            {/* Overlay badge on preview */}
            <div className="absolute top-4 inset-x-4 flex justify-between items-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold border border-white/10">
                پیش‌نمایش عکس ثبت‌شده
              </span>
              {capturedSnapshot.pose.isValidForAngle ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-xs font-black flex items-center gap-1 shadow-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>تأیید شد</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>زاویه تقریبی</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Live Camera View */
          <>
            {hasCamera ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                <CameraOverlay angle={angle} pose={livePose} quality={liveQuality} />
              </>
            ) : (
              /* Fallback when camera unavailable */
              <div className="p-8 text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-white text-base">بارگذاری عکس از گالری</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {cameraError || 'لطفاً یک عکس واضح از چهره خود انتخاب و آپلود فرمایید.'}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                >
                  انتخاب فایل تصویر
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Validation Warning Alert */}
      {validationWarning && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs leading-relaxed animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{validationWarning}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {capturedSnapshot ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <button
              type="button"
              onClick={handleRetake}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>عکاسی مجدد</span>
            </button>

            {onQuickTryOn && (
              <button
                type="button"
                onClick={() => onQuickTryOn(capturedSnapshot)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ پرو هوشمند رتبه ۱ با همین تصویر</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={`${
                onQuickTryOn
                  ? 'px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700'
                  : 'flex-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-102 active:scale-98'
              } flex items-center justify-center gap-2 transition-all cursor-pointer`}
            >
              <span>{isQuickMode ? 'ادامه اسکن ۳ مرحله‌ای' : 'تأیید و ادامه'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Switch Camera Button */}
            {hasCamera && (
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                title="تغییر دوربین جلو / عقب"
                className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 transition-colors"
              >
                <SwitchCamera className="w-5 h-5 text-slate-300" />
              </button>
            )}

            {/* Shutter Capture Button */}
            {hasCamera && (
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 hover:scale-102 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>ثبت عکس ({angle === 'front' ? 'روبرو' : angle === 'left' ? 'چپ' : 'راست'})</span>
              </button>
            )}

            {/* Upload from file button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="آپلود فایل از گالری"
              className="px-4 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">آپلود عکس</span>
            </button>
          </>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
