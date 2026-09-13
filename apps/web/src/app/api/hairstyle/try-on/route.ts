import { NextRequest, NextResponse } from 'next/server';
import { buildIdentityPreservingPrompt } from '@/modules/hairstyle/try-on/prompt-builder';
import { getActiveImageEditingProvider } from '@/modules/hairstyle/try-on/providers';
import { TryOnRequestPayload, TryOnResponsePayload } from '@/modules/hairstyle/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TryOnRequestPayload;

    if (!body || !body.frontImage) {
      return NextResponse.json(
        {
          success: false,
          error: 'تصویر روبرو (Front Photo) الزامی است.',
        },
        { status: 400 }
      );
    }

    if (!body.hairstyle || !body.hairstyle.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'مدل موی انتخابی الزامی است.',
        },
        { status: 400 }
      );
    }

    if (!body.userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'پروفایل ساختاریافته چهره کاربر الزامی است.',
        },
        { status: 400 }
      );
    }

    // 1. Build strict identity-preserving prompt
    const { prompt, negativePrompt, hairMaskInstructions } = buildIdentityPreservingPrompt(
      body.userProfile,
      body.hairstyle
    );

    // 2. Select image-editing provider (OpenAI / Replicate / Fal / DevMock)
    const provider = getActiveImageEditingProvider();

    // 3. Execute image editing request
    const result = await provider.editHairstyle({
      frontImage: body.frontImage,
      userProfile: body.userProfile,
      hairstyle: body.hairstyle,
      prompt,
      negativePrompt,
      hairMaskInstructions,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'خطا در تولید تصویر مدل مو با هوش مصنوعی',
          originalImageUrl: body.frontImage,
          generatedImageUrl: body.frontImage,
          hairstyle: body.hairstyle,
          provider: provider.id,
          isDevMock: result.isDevMock,
          processingTimeMs: result.processingTimeMs,
        } as TryOnResponsePayload,
        { status: 502 }
      );
    }

    const responsePayload: TryOnResponsePayload = {
      success: true,
      originalImageUrl: body.frontImage,
      generatedImageUrl: result.generatedImageUrl,
      hairstyle: body.hairstyle,
      provider: provider.id,
      isDevMock: result.isDevMock,
      processingTimeMs: result.processingTimeMs,
      message: result.message,
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('[API /api/hairstyle/try-on error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'خطای سرور در پردازش درخواست پرو مجازی',
      },
      { status: 500 }
    );
  }
}
