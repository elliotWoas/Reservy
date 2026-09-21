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

    // 2. Select image-editing provider (Gemini / Replicate / OpenAI / Fal / DevMock)
    const provider = getActiveImageEditingProvider();

    console.log('\n==============================================');
    console.log(`[API /api/hairstyle/try-on] 🚀 دریافت درخواست پرو مجازی مدل مو`);
    console.log(`[API /api/hairstyle/try-on] 👤 فرم چهره: ${body.userProfile.face?.shape?.label || 'نامشخص'}`);
    const hairstylePersian = body.hairstyle.persianName || body.hairstyle.nameFa || body.hairstyle.name;
    console.log(`[API /api/hairstyle/try-on] ✂️ مدل موی انتخابی: ${hairstylePersian} (${body.hairstyle.name})`);
    console.log(`[API /api/hairstyle/try-on] 🤖 پرووایدر فعال: ${provider.id} (${provider.name})`);
    console.log('==============================================');

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
      console.warn(`[API /api/hairstyle/try-on] ⚠️ پردازش ناموفق بود: ${result.error}`);
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

    console.log(`[API /api/hairstyle/try-on] ✅ پردازش موفق (${result.processingTimeMs}ms)`);

    const finalImageUrl = result.imageUrl || result.generatedImageUrl;
    const finalFaceShape = result.faceShape || body.userProfile.face?.shape?.label || 'oblong';
    const finalHairStyle = result.hairStyle || body.hairstyle.name;

    const responsePayload: TryOnResponsePayload = {
      success: true,
      imageUrl: finalImageUrl,
      faceShape: finalFaceShape,
      hairStyle: finalHairStyle,
      originalImageUrl: body.frontImage,
      generatedImageUrl: finalImageUrl,
      hairstyle: body.hairstyle,
      provider: provider.id,
      isDevMock: result.isDevMock,
      processingTimeMs: result.processingTimeMs,
      message: result.message,
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('[API /api/hairstyle/try-on] ❌ خطای غیرمنتظره در پردازش درخواست:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'خطای سرور در پردازش درخواست پرو مجازی',
      },
      { status: 500 }
    );
  }
}
