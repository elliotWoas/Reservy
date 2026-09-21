import { ImageEditingProvider, TryOnProviderParams, TryOnProviderResult } from './interface';

export class OpenAIImageEditingProvider implements ImageEditingProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI DALL-E Editing API';

  constructor(private readonly apiKey: string) {}

  async editHairstyle(params: TryOnProviderParams): Promise<TryOnProviderResult> {
    const startTime = Date.now();

    try {
      // Strip data URL prefix if present and convert to Blob
      const base64Data = params.frontImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: 'image/png' });

      const formData = new FormData();
      formData.append('image', blob, 'user_face.png');
      formData.append('prompt', params.prompt);
      formData.append('n', '1');
      formData.append('size', '1024x1024');
      formData.append('response_format', 'b64_json');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const json = await response.json();
      const b64 = json.data?.[0]?.b64_json;
      const url = json.data?.[0]?.url;

      const generatedImageUrl = b64 ? `data:image/png;base64,${b64}` : url;
      if (!generatedImageUrl) {
        throw new Error('No image returned from OpenAI');
      }

      return {
        success: true,
        generatedImageUrl,
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
        error: err?.message || 'خطا در ارتباط با سرویس هوش مصنوعی OpenAI',
      };
    }
  }
}
