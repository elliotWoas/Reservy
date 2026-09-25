import { ImageEditingProvider, TryOnProviderParams, TryOnProviderResult } from './interface';

export class FalImageEditingProvider implements ImageEditingProvider {
  readonly id = 'fal';
  readonly name = 'Fal.ai Realtime Inpainting API';

  constructor(private readonly apiKey: string) {}

  async editHairstyle(params: TryOnProviderParams): Promise<TryOnProviderResult> {
    const startTime = Date.now();

    try {
      const response = await fetch('https://fal.run/fal-ai/flux-general/image-to-image', {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: params.frontImage,
          prompt: params.prompt,
          strength: 0.75,
          guidance_scale: 7.5,
          num_inference_steps: 28,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal.ai API error (${response.status}): ${errorText}`);
      }

      const json = await response.json();
      const outputUrl = json.images?.[0]?.url;

      if (!outputUrl) {
        throw new Error('No output image received from Fal.ai');
      }

      return {
        success: true,
        generatedImageUrl: outputUrl,
        providerId: this.id,
        isDevMock: false,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        generatedImageUrl: params.frontImage,
        providerId: this.id,
        isDevMock: false,
        processingTimeMs: Date.now() - startTime,
        error: err?.message || 'خطا در ارتباط با سرویس Fal.ai',
      };
    }
  }
}
