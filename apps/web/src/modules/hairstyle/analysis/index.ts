import {
  CaptureAngle,
  CaptureData,
  HairDensity,
  HairLength,
  HairTexture,
  HairlineType,
  MaintenancePreference,
  StructuredUserProfile,
  StylePreference,
} from '../types';
import { detectFaceInCanvas } from './face-detector';
import { calculateFaceGeometry } from './face-geometry';
import { classifyFaceShape } from './face-shape';
import { estimateHeadPose } from './pose-estimator';
import { assessImageQuality } from './quality-assessor';

export * from './face-detector';
export * from './face-geometry';
export * from './face-shape';
export * from './pose-estimator';
export * from './quality-assessor';

export function analyzeCanvasCapture(
  canvas: HTMLCanvasElement,
  targetAngle: CaptureAngle
): Omit<CaptureData, 'dataUrl'> & { detected: boolean; errorMessage?: string } {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);

  // 1. Detect face & extract landmarks
  const detection = detectFaceInCanvas(canvas, ctx);

  if (!detection.detected || !detection.landmarks || !detection.boundingBox) {
    const quality = assessImageQuality(imageData);
    return {
      detected: false,
      errorMessage: 'چهره‌ای در تصویر شناسایی نشد. لطفاً صورت خود را روبروی دوربین قرار دهید.',
      width,
      height,
      quality,
      pose: {
        yaw: 0,
        pitch: 0,
        roll: 0,
        isValidForAngle: false,
        angleStatus: 'invalid',
        feedback: 'چهره شناسایی نشد.',
      },
      timestamp: Date.now(),
    };
  }

  // 2. Assess quality with detected face bounding box
  const quality = assessImageQuality(imageData, detection.boundingBox);

  // 3. Estimate head pose
  const pose = estimateHeadPose(detection.landmarks, targetAngle);

  // 4. Compute geometry
  const geometry = calculateFaceGeometry(detection.landmarks);

  return {
    detected: true,
    width,
    height,
    quality,
    pose,
    landmarks: detection.landmarks,
    geometry,
    timestamp: Date.now(),
  };
}

export function buildStructuredUserProfile(params: {
  front: CaptureData;
  left?: CaptureData;
  right?: CaptureData;
  hair: {
    texture: HairTexture;
    density: HairDensity;
    length: HairLength;
    hairline: HairlineType;
  };
  preferences: {
    maintenance: MaintenancePreference;
    style: StylePreference;
  };
}): StructuredUserProfile {
  const { front, left, right, hair, preferences } = params;

  // Use front geometry as canonical face dimensions
  const frontGeo = front.geometry || {
    width: 180,
    height: 230,
    aspectRatio: 0.78,
    foreheadWidth: 155,
    cheekboneWidth: 175,
    jawWidth: 150,
    ratios: {
      foreheadToJaw: 1.03,
      cheekboneToJaw: 1.16,
      heightToWidth: 1.28,
    },
  };

  const shapeEstimate = classifyFaceShape(frontGeo);

  // Capture quality evaluation
  const isFrontGood = front.quality.isAcceptable;
  const isLeftGood = left ? left.quality.isAcceptable : true;
  const isRightGood = right ? right.quality.isAcceptable : true;

  let overallQuality: 'good' | 'fair' | 'poor' = 'good';
  if (!isFrontGood || (!isLeftGood && !isRightGood)) {
    overallQuality = 'poor';
  } else if (!isLeftGood || !isRightGood) {
    overallQuality = 'fair';
  }

  return {
    capture: {
      front: Boolean(front.landmarks),
      left: Boolean(left?.landmarks),
      right: Boolean(right?.landmarks),
      quality: overallQuality,
    },
    face: {
      shape: {
        label: shapeEstimate.label,
        confidence: shapeEstimate.confidence,
      },
      width: frontGeo.width,
      height: frontGeo.height,
      aspect_ratio: frontGeo.aspectRatio,
      forehead_width: frontGeo.foreheadWidth,
      cheekbone_width: frontGeo.cheekboneWidth,
      jaw_width: frontGeo.jawWidth,
      // Anthropometric facial ratios calculated from browser computer vision
      forehead_to_jaw_ratio: frontGeo.ratios?.foreheadToJaw ?? 1.0,
      cheekbone_to_jaw_ratio: frontGeo.ratios?.cheekboneToJaw ?? 1.15,
      height_to_width_ratio: frontGeo.ratios?.heightToWidth ?? 1.3,
    },
    pose: {
      front: front.pose.isValidForAngle ? 'valid' : 'invalid',
      left: left && left.pose.isValidForAngle ? 'valid' : 'invalid',
      right: right && right.pose.isValidForAngle ? 'valid' : 'invalid',
    },
    hair: {
      texture: hair.texture,
      density: hair.density,
      length: hair.length,
      hairline: hair.hairline,
    },
    preferences: {
      maintenance: preferences.maintenance,
      style: preferences.style,
    },
  };
}
