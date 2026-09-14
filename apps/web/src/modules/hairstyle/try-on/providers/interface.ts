import { Hairstyle, StructuredUserProfile } from '../../types';

export interface TryOnProviderParams {
  frontImage: string; // Base64 or URL
  userProfile: StructuredUserProfile;
  hairstyle: Hairstyle;
  prompt: string;
  negativePrompt: string;
  hairMaskInstructions?: string;
}

export interface TryOnProviderResult {
  success: boolean;
  generatedImageUrl: string;
  imageUrl?: string;
  faceShape?: string;
  hairStyle?: string;
  providerId: string;
  isDevMock: boolean;
  processingTimeMs: number;
  message?: string;
  error?: string;
}

export interface ImageEditingProvider {
  readonly id: string;
  readonly name: string;
  editHairstyle(params: TryOnProviderParams): Promise<TryOnProviderResult>;
}
