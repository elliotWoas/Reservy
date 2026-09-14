'use client';

import { useState, useMemo } from 'react';
import {
  CaptureData,
  FaceGeometry,
  FaceShapeEstimate,
  Hairstyle,
  StructuredUserProfile,
  TryOnResponsePayload,
  WizardStep,
} from '../types';
import { buildStructuredUserProfile, calculateFaceGeometry, classifyFaceShape } from '../analysis';
import { getTop3Recommendations } from '../recommendation';
import { requestVirtualTryOn } from '../try-on/service';
import { IntroStep } from './IntroStep';
import { CaptureStep } from './CaptureStep';
import { AnalysisStep } from './AnalysisStep';
import { RecommendationStep } from './RecommendationStep';
import { TryOnLoadingStep } from './TryOnLoadingStep';
import { ResultStep } from './ResultStep';
import { Sparkles, Camera, Sliders, CheckCircle2 } from 'lucide-react';

export function HairstyleWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('INTRO');
  const [isQuickMode, setIsQuickMode] = useState<boolean>(false);

  // Captures
  const [frontCapture, setFrontCapture] = useState<CaptureData | undefined>();
  const [leftCapture, setLeftCapture] = useState<CaptureData | undefined>();
  const [rightCapture, setRightCapture] = useState<CaptureData | undefined>();

  // Profile & Recommendations
  const [userProfile, setUserProfile] = useState<StructuredUserProfile | undefined>();
  const [recommendations, setRecommendations] = useState<Hairstyle[]>([]);

  // Selected Hairstyle & API Result
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | undefined>();
  const [tryOnResult, setTryOnResult] = useState<TryOnResponsePayload | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);

  // Derived geometry & shape from front capture
  const frontGeometry: FaceGeometry = useMemo(() => {
    if (frontCapture?.landmarks) {
      return calculateFaceGeometry(frontCapture.landmarks);
    }
    return {
      width: 180,
      height: 232,
      aspectRatio: 0.776,
      foreheadWidth: 156,
      cheekboneWidth: 176,
      jawWidth: 152,
      ratios: {
        foreheadToJaw: 1.026,
        cheekboneToJaw: 1.158,
        heightToWidth: 1.289,
      },
    };
  }, [frontCapture]);

  const frontShapeEstimate: FaceShapeEstimate = useMemo(() => {
    return classifyFaceShape(frontGeometry);
  }, [frontGeometry]);

  // Execute Try-On API Call
  const handleExecuteTryOn = async (style: Hairstyle, profile: StructuredUserProfile) => {
    if (!frontCapture) return;

    setSelectedHairstyle(style);
    setApiError(null);
    setCurrentStep('TRY_ON_LOADING');

    try {
      const result = await requestVirtualTryOn({
        frontImage: frontCapture.dataUrl,
        userProfile: profile,
        hairstyle: style,
      });

      setTryOnResult(result);
      setCurrentStep('RESULT');
    } catch (err: any) {
      setApiError(err?.message || 'خطا در برقراری ارتباط با موتور هوش مصنوعی');
    }
  };

  // Quick Auto-Try-On: 1-photo flow that directly estimates face shape,
  // picks the #1 recommended haircut, and generates the try-on without manual questionnaire
  const handleQuickAutoTryOn = async (capture: CaptureData) => {
    setFrontCapture(capture);
    setApiError(null);

    // 1. Calculate face geometry from front capture landmarks
    const geometry: FaceGeometry = capture.landmarks
      ? calculateFaceGeometry(capture.landmarks)
      : {
          width: 180,
          height: 232,
          aspectRatio: 0.776,
          foreheadWidth: 156,
          cheekboneWidth: 176,
          jawWidth: 152,
          ratios: {
            foreheadToJaw: 1.026,
            cheekboneToJaw: 1.158,
            heightToWidth: 1.289,
          },
        };

    // 2. Build structured user profile with standard defaults
    const profile = buildStructuredUserProfile({
      front: capture,
      hair: {
        texture: 'straight',
        density: 'medium',
        length: 'medium',
        hairline: 'normal',
      },
      preferences: {
        maintenance: 'medium',
        style: 'modern',
      },
    });

    setUserProfile(profile);

    // 3. Get top 3 recommendations and pick the #1 best match
    const topRecommendations = getTop3Recommendations(profile);
    setRecommendations(topRecommendations);

    const bestHairstyle = topRecommendations[0];
    if (!bestHairstyle) return;

    setSelectedHairstyle(bestHairstyle);
    setCurrentStep('TRY_ON_LOADING');

    try {
      const result = await requestVirtualTryOn({
        frontImage: capture.dataUrl,
        userProfile: profile,
        hairstyle: bestHairstyle,
      });

      setTryOnResult(result);
      setCurrentStep('RESULT');
    } catch (err: any) {
      setApiError(err?.message || 'خطا در برقراری ارتباط با موتور هوش مصنوعی');
    }
  };

  // Step Progress Bar indicator
  const getStepProgressIndex = () => {
    switch (currentStep) {
      case 'INTRO':
        return 0;
      case 'CAPTURE_FRONT':
        return 1;
      case 'CAPTURE_LEFT':
        return 2;
      case 'CAPTURE_RIGHT':
        return 3;
      case 'ANALYZING':
        return 4;
      case 'RECOMMENDATIONS':
        return 5;
      case 'TRY_ON_LOADING':
      case 'RESULT':
        return 6;
    }
  };

  const progressIndex = getStepProgressIndex();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-[#0B0F17] text-slate-100 flex flex-col items-center">
      {/* Top Wizard Steps Bar */}
      {currentStep !== 'INTRO' && (
        <div className="w-full max-w-2xl mb-8">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
            <span className={progressIndex >= 1 ? 'text-amber-400 font-bold' : ''}>۱. روبرو</span>
            <span className={progressIndex >= 2 ? 'text-amber-400 font-bold' : ''}>۲. چپ</span>
            <span className={progressIndex >= 3 ? 'text-amber-400 font-bold' : ''}>۳. راست</span>
            <span className={progressIndex >= 4 ? 'text-amber-400 font-bold' : ''}>۴. آنالیز</span>
            <span className={progressIndex >= 5 ? 'text-amber-400 font-bold' : ''}>۵. پیشنهادها</span>
            <span className={progressIndex >= 6 ? 'text-emerald-400 font-bold' : ''}>۶. نتیجه پرو</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${(progressIndex / 6) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Screen 1: INTRO */}
      {currentStep === 'INTRO' && (
        <IntroStep
          onStart={() => {
            setIsQuickMode(false);
            setCurrentStep('CAPTURE_FRONT');
          }}
          onQuickStart={() => {
            setIsQuickMode(true);
            setCurrentStep('CAPTURE_FRONT');
          }}
        />
      )}

      {/* Screen 2: CAPTURE_FRONT */}
      {currentStep === 'CAPTURE_FRONT' && (
        <CaptureStep
          angle="front"
          initialData={frontCapture}
          isQuickMode={isQuickMode}
          onQuickTryOn={handleQuickAutoTryOn}
          onCapture={(data) => {
            setFrontCapture(data);
            setCurrentStep('CAPTURE_LEFT');
          }}
          onBack={() => setCurrentStep('INTRO')}
        />
      )}

      {/* Screen 3: CAPTURE_LEFT */}
      {currentStep === 'CAPTURE_LEFT' && (
        <CaptureStep
          angle="left"
          initialData={leftCapture}
          onCapture={(data) => {
            setLeftCapture(data);
            setCurrentStep('CAPTURE_RIGHT');
          }}
          onBack={() => setCurrentStep('CAPTURE_FRONT')}
        />
      )}

      {/* Screen 4: CAPTURE_RIGHT */}
      {currentStep === 'CAPTURE_RIGHT' && (
        <CaptureStep
          angle="right"
          initialData={rightCapture}
          onCapture={(data) => {
            setRightCapture(data);
            setCurrentStep('ANALYZING');
          }}
          onBack={() => setCurrentStep('CAPTURE_LEFT')}
        />
      )}

      {/* Screen 5: ANALYZING */}
      {currentStep === 'ANALYZING' && frontCapture && (
        <AnalysisStep
          geometry={frontGeometry}
          shapeEstimate={frontShapeEstimate}
          onProceed={(data) => {
            const profile = buildStructuredUserProfile({
              front: frontCapture,
              left: leftCapture,
              right: rightCapture,
              hair: data.hair,
              preferences: data.preferences,
            });

            setUserProfile(profile);

            // Generate Top 3
            const top3 = getTop3Recommendations(profile);
            setRecommendations(top3);

            setCurrentStep('RECOMMENDATIONS');
          }}
        />
      )}

      {/* Screen 6: RECOMMENDATIONS */}
      {currentStep === 'RECOMMENDATIONS' && (
        <RecommendationStep
          recommendations={recommendations}
          onSelectHairstyle={(style) => {
            if (userProfile) {
              handleExecuteTryOn(style, userProfile);
            }
          }}
          onBack={() => setCurrentStep('ANALYZING')}
        />
      )}

      {/* Screen 7: TRY_ON_LOADING */}
      {currentStep === 'TRY_ON_LOADING' && selectedHairstyle && (
        <TryOnLoadingStep
          hairstyle={selectedHairstyle}
          error={apiError}
          onRetry={() => {
            if (selectedHairstyle && userProfile) {
              handleExecuteTryOn(selectedHairstyle, userProfile);
            }
          }}
          onBack={() => setCurrentStep('RECOMMENDATIONS')}
        />
      )}

      {/* Screen 8: RESULT */}
      {currentStep === 'RESULT' && tryOnResult && selectedHairstyle && (
        <ResultStep
          tryOnResult={tryOnResult}
          selectedHairstyle={selectedHairstyle}
          onTryAnother={() => setCurrentStep('RECOMMENDATIONS')}
          onRestart={() => {
            setFrontCapture(undefined);
            setLeftCapture(undefined);
            setRightCapture(undefined);
            setUserProfile(undefined);
            setRecommendations([]);
            setSelectedHairstyle(undefined);
            setTryOnResult(undefined);
            setIsQuickMode(false);
            setCurrentStep('INTRO');
          }}
        />
      )}
    </div>
  );
}
