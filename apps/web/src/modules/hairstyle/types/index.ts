export type CaptureAngle = 'front' | 'left' | 'right';

export type FaceShapeType = 'oval' | 'square' | 'round' | 'oblong' | 'heart' | 'diamond';

export type HairTexture = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairDensity = 'low' | 'medium' | 'high';
export type HairLength = 'short' | 'medium' | 'long';
export type HairlineType = 'normal' | 'receding' | 'low' | 'high';

export type MaintenancePreference = 'low' | 'medium' | 'high';
export type StylePreference = 'modern' | 'classic' | 'trendy' | 'textured' | 'clean';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  chin: { x: number; y: number };
  foreheadCenter: { x: number; y: number };
  leftCheek: { x: number; y: number };
  rightCheek: { x: number; y: number };
  leftJaw: { x: number; y: number };
  rightJaw: { x: number; y: number };
}

export interface FaceGeometry {
  width: number;
  height: number;
  aspectRatio: number; // width / height
  foreheadWidth: number;
  cheekboneWidth: number;
  jawWidth: number;
  ratios: {
    foreheadToJaw: number;
    cheekboneToJaw: number;
    heightToWidth: number;
  };
}

export interface FaceShapeEstimate {
  label: FaceShapeType;
  confidence: number;
  candidateScores: Record<FaceShapeType, number>;
}

export interface HeadPose {
  yaw: number; // degrees: negative = turned left, positive = turned right
  pitch: number; // degrees: negative = tilted down, positive = tilted up
  roll: number; // degrees: tilt to shoulder
  isValidForAngle: boolean;
  angleStatus: 'valid' | 'invalid' | 'warning';
  feedback: string;
}

export interface ImageQualityMetrics {
  brightness: number; // 0 - 255
  isBrightnessAcceptable: boolean;
  sharpness: number; // variance of laplacian
  isSharpnessAcceptable: boolean;
  coverageRatio: number; // face area / image area
  isCoverageAcceptable: boolean;
  isCentered: boolean;
  overallScore: number; // 0 - 100
  isAcceptable: boolean;
  feedback: string[];
}

export interface CaptureData {
  dataUrl: string;
  width: number;
  height: number;
  quality: ImageQualityMetrics;
  pose: HeadPose;
  landmarks?: FaceLandmarks;
  geometry?: FaceGeometry;
  timestamp: number;
}

export interface StructuredUserProfile {
  capture: {
    front: boolean;
    left: boolean;
    right: boolean;
    quality: 'good' | 'fair' | 'poor';
  };
  face: {
    shape: {
      label: FaceShapeType;
      confidence: number;
    };
    width: number;
    height: number;
    aspect_ratio: number;
    forehead_width: number;
    cheekbone_width: number;
    jaw_width: number;
    forehead_to_jaw_ratio?: number;
    cheekbone_to_jaw_ratio?: number;
    height_to_width_ratio?: number;
  };
  pose: {
    front: 'valid' | 'invalid';
    left: 'valid' | 'invalid';
    right: 'valid' | 'invalid';
  };
  hair: {
    texture: HairTexture;
    density: HairDensity;
    length: HairLength;
    hairline: HairlineType;
    estimated_texture?: HairTexture;
    estimated_density?: HairDensity;
    hairline_type?: HairlineType;
  };
  preferences: {
    maintenance: MaintenancePreference;
    style: StylePreference;
  };
}

export interface Hairstyle {
  id: string;
  name: string;
  persianName: string;
  nameFa?: string;
  matchScore: number; // 0 - 100
  matchReasons: string[];
  description: string;
  topLength: string;
  sides: string;
  fringe: string;
  texture: string;
  volume: string;
  finish: string;
  maintenance: MaintenancePreference;
  barberNotes: string;
  previewColor?: string;
}

export interface TryOnRequestPayload {
  frontImage: string; // Base64 data URL
  userProfile: StructuredUserProfile;
  hairstyle: Hairstyle;
  instructions?: string;
}

export interface TryOnResponsePayload {
  success: boolean;
  imageUrl?: string;
  faceShape?: string;
  hairStyle?: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  hairstyle: Hairstyle;
  provider: string;
  isDevMock: boolean;
  processingTimeMs: number;
  message?: string;
  error?: string;
}

export type WizardStep =
  | 'INTRO'
  | 'CAPTURE_FRONT'
  | 'CAPTURE_LEFT'
  | 'CAPTURE_RIGHT'
  | 'ANALYZING'
  | 'RECOMMENDATIONS'
  | 'TRY_ON_LOADING'
  | 'RESULT';
