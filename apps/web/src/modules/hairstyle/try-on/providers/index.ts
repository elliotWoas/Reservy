import { AvalAIImageEditingProvider } from './avalai-provider';
import { DevMockProvider } from './dev-mock-provider';
import { FalImageEditingProvider } from './fal-provider';
import { GeminiImageEditingProvider } from './gemini-provider';
import { ImageEditingProvider } from './interface';
import { OpenAIImageEditingProvider } from './openai-provider';
import { ReplicateImageEditingProvider } from './replicate-provider';

export * from './interface';
export * from './avalai-provider';
export * from './dev-mock-provider';
export * from './openai-provider';
export * from './replicate-provider';
export * from './fal-provider';
export * from './gemini-provider';

export function getActiveImageEditingProvider(): ImageEditingProvider {
  const preferredProvider = process.env.IMAGE_EDITING_PROVIDER?.toLowerCase();
  const avalaiKey = process.env.AVALAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // 1. Explicit override via IMAGE_EDITING_PROVIDER
  if (preferredProvider === 'avalai' && avalaiKey) {
    return new AvalAIImageEditingProvider(avalaiKey);
  }
  if (preferredProvider === 'gemini' && geminiKey) {
    return new GeminiImageEditingProvider(geminiKey);
  }
  if (preferredProvider === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAIImageEditingProvider(process.env.OPENAI_API_KEY);
  }
  if (preferredProvider === 'replicate' && process.env.REPLICATE_API_TOKEN) {
    return new ReplicateImageEditingProvider(process.env.REPLICATE_API_TOKEN);
  }
  if (preferredProvider === 'fal' && (process.env.FAL_KEY || process.env.FAL_API_KEY)) {
    return new FalImageEditingProvider(process.env.FAL_KEY || process.env.FAL_API_KEY!);
  }

  // 2. PRIMARY: AvalAI (OpenAI-compatible)
  if (avalaiKey) {
    return new AvalAIImageEditingProvider(avalaiKey);
  }

  // 3. Fallbacks based on available credentials
  if (geminiKey) {
    return new GeminiImageEditingProvider(geminiKey);
  }
  if (process.env.REPLICATE_API_TOKEN) {
    return new ReplicateImageEditingProvider(process.env.REPLICATE_API_TOKEN);
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIImageEditingProvider(process.env.OPENAI_API_KEY);
  }
  if (process.env.FAL_KEY || process.env.FAL_API_KEY) {
    return new FalImageEditingProvider(process.env.FAL_KEY || process.env.FAL_API_KEY!);
  }

  // 4. Fallback to clearly separated DevMockProvider
  return new DevMockProvider();
}
