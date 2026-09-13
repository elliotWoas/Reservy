import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;

  if (geminiKey) {
    const isModernAuthKey = geminiKey.startsWith('AQ.');
    const isLegacyKey = geminiKey.startsWith('AIzaSy');

    return NextResponse.json({
      connected: true,
      provider: 'gemini',
      providerName: 'Google Gemini & Imagen 3',
      isDevMock: false,
      hasKey: true,
      keyPreview: `${geminiKey.substring(0, 6)}...${geminiKey.substring(geminiKey.length - 4)}`,
      statusText: isModernAuthKey
        ? 'متصل به Google AI Studio (کلید رسمی مدرن با هدر x-goog-api-key)'
        : isLegacyKey
        ? 'متصل به Google AI Studio (کلید کلاسیک)'
        : 'کلید Gemini تنظیم شده است',
      isStandardKey: true,
    });
  }

  if (openaiKey) {
    return NextResponse.json({
      connected: true,
      provider: 'openai',
      providerName: 'OpenAI DALL-E',
      isDevMock: false,
      hasKey: true,
      keyPreview: `${openaiKey.substring(0, 6)}...${openaiKey.substring(openaiKey.length - 4)}`,
      statusText: 'متصل به OpenAI API',
      isStandardKey: true,
    });
  }

  if (replicateToken) {
    return NextResponse.json({
      connected: true,
      provider: 'replicate',
      providerName: 'Replicate FLUX/SDXL',
      isDevMock: false,
      hasKey: true,
      keyPreview: `${replicateToken.substring(0, 6)}...`,
      statusText: 'متصل به Replicate API',
      isStandardKey: true,
    });
  }

  if (falKey) {
    return NextResponse.json({
      connected: true,
      provider: 'fal',
      providerName: 'Fal.ai Inpainting',
      isDevMock: false,
      hasKey: true,
      keyPreview: `${falKey.substring(0, 6)}...`,
      statusText: 'متصل به Fal.ai API',
      isStandardKey: true,
    });
  }

  return NextResponse.json({
    connected: false,
    provider: 'dev-mock',
    providerName: 'حالت آزمایشی داخلی (Dev Mock)',
    isDevMock: true,
    hasKey: false,
    statusText: 'بدون کلید API (حالت آزمایشی توسعه فعال است)',
    isStandardKey: false,
  });
}
