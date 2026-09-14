import { ImageEditingProvider, TryOnProviderParams, TryOnProviderResult } from './interface';

export class ReplicateImageEditingProvider implements ImageEditingProvider {
  readonly id = 'replicate';
  readonly name = 'Replicate FLUX/SDXL Inpainting API';

  constructor(private readonly apiToken: string) {}

  async editHairstyle(params: TryOnProviderParams): Promise<TryOnProviderResult> {
    const startTime = Date.now();

    try {
      const selectedModel = process.env.REPLICATE_MODEL?.toLowerCase() || 'flux';
      let endpoint = 'https://api.replicate.com/v1/predictions';
      let requestBody: Record<string, any>;

      if (selectedModel === 'hairfastgan') {
        // Specialized HairFastGAN Hair Transfer Model
        endpoint = 'https://api.replicate.com/v1/models/ronindesign/hairfastgan/predictions';
        requestBody = {
          input: {
            face_image: params.frontImage,
            shape_image: params.frontImage,
            color_image: params.frontImage,
          },
        };
      } else {
        // FLUX.1 Fill / SDXL Inpainting for state-of-the-art identity preservation
        requestBody = {
          version: '71542f53d712217be5439a3f95e2d1d0ab91f93f',
          input: {
            image: params.frontImage,
            prompt: params.prompt,
            negative_prompt: params.negativePrompt,
            guidance_scale: 7.5,
            num_inference_steps: 28,
          },
        };
      }

      const createResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          Prefer: 'wait=30',
        },
        body: JSON.stringify(requestBody),
      });

      if (!createResponse.ok) {
        const err = await createResponse.text();
        throw new Error(`Replicate API Error (${createResponse.status}): ${err}`);
      }

      let prediction = await createResponse.json();

      // Poll if not finished immediately
      let attempts = 0;
      while (
        (prediction.status === 'starting' || prediction.status === 'processing') &&
        attempts < 20
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;

        const checkResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        });

        if (checkResponse.ok) {
          prediction = await checkResponse.json();
        }
      }

      if (prediction.status === 'succeeded' && prediction.output) {
        const outputUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;

        return {
          success: true,
          generatedImageUrl: outputUrl,
          providerId: this.id,
          isDevMock: false,
          processingTimeMs: Date.now() - startTime,
        };
      } else {
        throw new Error(prediction.error || `Prediction ended with status: ${prediction.status}`);
      }
    } catch (err: any) {
      return {
        success: false,
        generatedImageUrl: params.frontImage,
        providerId: this.id,
        isDevMock: false,
        processingTimeMs: Date.now() - startTime,
        error: err?.message || 'خطا در پردازش تصویر با سرویس Replicate',
      };
    }
  }
}
