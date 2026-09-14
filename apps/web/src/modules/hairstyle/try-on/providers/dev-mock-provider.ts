import { ImageEditingProvider, TryOnProviderParams, TryOnProviderResult } from './interface';

export class DevMockProvider implements ImageEditingProvider {
  readonly id = 'dev-mock';
  readonly name = 'Development Offline Mock Provider';

  async editHairstyle(params: TryOnProviderParams): Promise<TryOnProviderResult> {
    const startTime = Date.now();

    // Simulate realistic AI generation latency (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In dev mock mode, return the user's front image with clear diagnostic metadata
    return {
      success: true,
      generatedImageUrl: params.frontImage,
      providerId: this.id,
      isDevMock: true,
      processingTimeMs: Date.now() - startTime,
      message:
        'حالت آزمایشی توسعه (Dev Mock): برای اتصال به مدل‌های هوش مصنوعی زنده، کلید REPLICATE_API_TOKEN یا OPENAI_API_KEY یا FAL_KEY را در فایل .env تنظیم فرمایید.',
    };
  }
}
