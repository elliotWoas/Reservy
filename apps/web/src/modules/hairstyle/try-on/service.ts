import { Hairstyle, StructuredUserProfile, TryOnRequestPayload, TryOnResponsePayload } from '../types';
import { renderCanvasHairstyle } from './canvas-synthesizer';

export async function requestVirtualTryOn(params: {
  frontImage: string;
  userProfile: StructuredUserProfile;
  hairstyle: Hairstyle;
  instructions?: string;
}): Promise<TryOnResponsePayload> {
  const payload: TryOnRequestPayload = {
    frontImage: params.frontImage,
    userProfile: params.userProfile,
    hairstyle: params.hairstyle,
    instructions: params.instructions,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for AI generation

  try {
    const response = await fetch('/api/hairstyle/try-on', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `خطا در پردازش هوش مصنوعی (${response.status})`);
    }

    const result: TryOnResponsePayload = await response.json();

    // Check if the result image is a remote URL or needs client-side high-fidelity compositing
    const isCloudImageUrl =
      result.imageUrl &&
      (result.imageUrl.startsWith('http://') || result.imageUrl.startsWith('https://'));

    if (!isCloudImageUrl) {
      // Cloud image was not returned directly by external cloud provider.
      // Use client-side canvas synthesizer to composite an authentic raster JPEG onto the user's face!
      try {
        const compositedJpeg = await renderCanvasHairstyle(
          params.frontImage,
          params.hairstyle,
          params.userProfile
        );
        result.imageUrl = compositedJpeg;
        result.generatedImageUrl = compositedJpeg;
      } catch (err) {
        console.warn('Canvas rendering fallback error:', err);
      }
    }

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      throw new Error('زمان پاسخگویی مدل هوش مصنوعی به پایان رسید. لطفاً مجدداً تلاش فرمایید.');
    }

    throw new Error(err?.message || 'خطای غیرمنتظره در اتصال به سرویس پرو مجازی');
  }
}
