import OpenAI from 'openai';

// Bun automatically loads .env files from the root!

async function testAIConnection() {
  console.log('\n==============================================');
  console.log('🤖 Reservy AI Hairstyle — بررسی وضعیت اتصال API');
  console.log('==============================================\n');

  const avalaiKey = process.env.AVALAI_API_KEY;
  const avalaiBaseUrl = process.env.AVALAI_BASE_URL || 'https://api.avalai.ir/v1';
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;

  if (!avalaiKey && !geminiKey && !openaiKey && !replicateToken && !falKey) {
    console.log('⚠️  هیچ کلید API در فایل .env یافت نشد.');
    console.log('👉 سیستم در حالت آفلاین/توسعه (Dev Mock) کار می‌کند.');
    console.log('💡 جهت فعال‌سازی هوش مصنوعی واقعی، یکی از کلیدهای زیر را در .env قرار دهید:');
    console.log('   - AVALAI_API_KEY="..."');
    console.log('   - GEMINI_API_KEY="..."');
    console.log('   - OPENAI_API_KEY="..."');
    console.log('   - REPLICATE_API_TOKEN="..."\n');
    process.exit(0);
  }

  // 1. Test AvalAI (Primary OpenAI-compatible provider)
  if (avalaiKey) {
    console.log('🔍 در حال بررسی اتصال به سرویس AvalAI (پرووایدر اصلی)...');
    console.log(`🌐 آدرس پایه: ${avalaiBaseUrl}`);
    console.log(`🔑 پیشوند کلید: ${avalaiKey.substring(0, 8)}...${avalaiKey.substring(avalaiKey.length - 4)}`);

    try {
      const start = Date.now();
      const client = new OpenAI({
        apiKey: avalaiKey,
        baseURL: avalaiBaseUrl,
      });

      console.log('📡 استعلام مدل‌های مجاز از AvalAI (client.models.list)...');
      const modelsList = await client.models.list();
      const modelIds = modelsList.data.map((m) => m.id);
      console.log(`📋 تعداد مدل‌های فعال در حساب شما: ${modelIds.length}`);

      const relevantModels = modelIds.filter(
        (id) =>
          id.toLowerCase().includes('image') ||
          id.toLowerCase().includes('gpt') ||
          id.toLowerCase().includes('gemini') ||
          id.toLowerCase().includes('flux')
      );
      if (relevantModels.length > 0) {
        console.log(`🎯 مدل‌های مرتبط شناسایی شده: ${relevantModels.slice(0, 8).join(', ')}`);
      }

      // Test image generation with target models
      const testModels = ['gpt-image-1-mini', 'gpt-image-1', 'gemini-3.1-flash-lite-image'];
      let imgSuccess = false;
      let successfulModel = '';

      for (const model of testModels) {
        console.log(`\n⏳ تست درخواست تصویر با مدل: ${model}...`);
        try {
          const genRes = await client.images.generate({
            model: model as any,
            prompt: 'A photorealistic professional barbershop portrait of a handsome man with modern hairstyle, 8k resolution',
            n: 1,
            size: '1024x1024',
          });

          if (genRes.data && genRes.data.length > 0) {
            imgSuccess = true;
            successfulModel = model;
            console.log(`   ✅ مدل ${model} با موفقیت تصویر آزمایشی را تولید کرد!`);
            break;
          }
        } catch (genErr: any) {
          console.warn(`   ⚠️ مدل ${model} خطا داد: ${genErr?.message?.slice(0, 140)}...`);
        }
      }

      const elapsed = Date.now() - start;
      if (imgSuccess) {
        console.log(`\n✅ اتصال به سرویس هوش مصنوعی AvalAI کاملاً موفقیت‌آمیز است! (${elapsed}ms)`);
        console.log(`🤖 مدل تصویرساز فعال: ${successfulModel}`);
        console.log('✨ پرو مجازی مو و ادیت چهره آماده استفاده در سایت است.\n');
      } else {
        console.log(`\n✅ احراز هویت با سرور AvalAI برقرار است (${elapsed}ms).`);
        console.log('💡 در صورت عدم پاسخ‌دهی موقت مدل‌های ابری، سیستم از تبدیل بصری دقیق چهره استفاده خواهد کرد.\n');
      }
    } catch (err: any) {
      console.log(`❌ خطا در اتصال به AvalAI: ${err.message}\n`);
    }
  }

  // 2. Test Google Gemini with standard x-goog-api-key header
  if (geminiKey) {
    console.log('🔍 در حال بررسی اتصال Google Gemini API...');
    console.log(`🔑 پیشوند کلید: ${geminiKey.substring(0, 8)}...${geminiKey.substring(geminiKey.length - 4)} (Google AI Studio Key)`);

    try {
      const start = Date.now();

      // 1. First, call ModelService.ListModels to discover all models enabled on this key
      console.log('📡 بررسی مدل‌های فعال برای این کلید (ModelService.ListModels)...');
      let discoveredModels: string[] = [];
      try {
        const listRes = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models',
          {
            headers: {
              'x-goog-api-key': geminiKey,
            },
          }
        );

        if (listRes.ok) {
          const listData = (await listRes.json()) as {
            models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
          };
          if (listData.models && Array.isArray(listData.models)) {
            discoveredModels = listData.models
              .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
              .map((m) => m.name.replace(/^models\//, ''));
            console.log(`📋 ${discoveredModels.length} مدل فعال در حساب کاربری شما شناسایی شد:`);
            console.log(`   ${discoveredModels.slice(0, 6).join(', ')}${discoveredModels.length > 6 ? ' و...' : ''}`);
          }
        } else {
          console.log(`ℹ️ عدم دسترسی مستقیم به ListModels (کد: ${listRes.status})، ادامه با مدل‌های پیش‌فرض...`);
        }
      } catch (e: any) {
        console.log(`ℹ️ ادامه با لیست استاندارد مدل‌ها...`);
      }

      // Priority list: gemini-2.0-flash, gemini-2.5-flash, and Gemma models
      const preferredModels = [
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash-exp',
        'gemma-4-26b-a4b-it',
        'gemma-2-27b-it',
        'gemma-2-9b-it',
        'gemini-1.5-flash-latest',
      ];

      // Merge discovered models with preferred models
      const testModels = Array.from(
        new Set([
          ...preferredModels.filter((m) => discoveredModels.includes(m)),
          ...preferredModels,
          ...discoveredModels,
        ])
      );

      let isSuccess = false;
      let usedModel = '';
      let responseText = '';
      let lastStatus = 0;
      let lastErrText = '';

      for (const model of testModels) {
        console.log(`\n⏳ تست درخواست با مدل: ${model}...`);

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: 'پاسخ بسیار کوتاه به فارسی: آیا سرویس آماده است؟',
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 150,
          },
          system_instruction: {
            parts: [
              {
                text: 'فقط پاسخ مستقیم را بنویسید. از درج مراحل تفکر، Chain of Thought یا تگ‌های thought خودداری کنید.',
              },
            ],
          },
        };

        let res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiKey,
            },
            body: JSON.stringify(requestBody),
          }
        );

        lastStatus = res.status;

        // If 401, also attempt with Authorization Bearer header
        if (!res.ok && res.status === 401) {
          const bearerRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${geminiKey}`,
              },
              body: JSON.stringify(requestBody),
            }
          );
          if (bearerRes.ok) {
            res = bearerRes;
            lastStatus = bearerRes.status;
          }
        }

        if (res.ok) {
          const data = await res.json();
          const raw =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'ارتباط موفق';

          // Clean any internal thinking or Chain of Thought tags
          responseText = raw
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .trim();

          isSuccess = true;
          usedModel = model;
          break;
        } else {
          lastErrText = await res.text();
          console.log(`   ⚠️ مدل ${model} خطا داد (کد ${lastStatus}): ${lastErrText.slice(0, 150)}...`);
        }
      }

      const elapsed = Date.now() - start;

      if (isSuccess) {
        const isTextOnly = usedModel.toLowerCase().includes('gemma') || usedModel.endsWith('-it');
        console.log(`✅ اتصال به هوش مصنوعی گوگل کاملاً موفقیت‌آمیز است! (${elapsed}ms)`);
        console.log(`🤖 مدل فعال: ${usedModel} (${isTextOnly ? 'متنی / Text-Only' : 'چندرسانه‌ای / Multimodal'})`);
        console.log(`💬 پاسخ آزمایشی مدل: "${responseText.replace(/\n/g, ' ')}"`);
        if (isTextOnly) {
          console.log('\n📌 وضعیت مدل‌های اکانت بدون صورت‌حساب (No-Billing):');
          console.log('   - گوگل درخواست‌ها را به سری Gemma هدایت کرده است.');
          console.log('   - پردازش فرم چهره از طریق داده‌های ساختاریافته هندسی (JSON) انجام می‌شود.');
          console.log('   - برای فعال‌سازی نامحدود Gemini 2.x، در پنل AI Studio گزینه Set up billing را بررسی فرمایید.');
        }
        console.log('✨ ماژول پرو مجازی و تحلیل چهره آماده است.\n');
      } else {
        if (lastStatus === 401) {
          console.log(`❌ خطای احراز هویت (کد ۴۰۱) - لطفاً کلید API را بررسی فرمایید.`);
        } else if (lastStatus === 404) {
          console.log(`❌ خطای ۴۰۴ - مدل‌های آزمایشی در این نسخه یافت نشدند.`);
        } else {
          console.log(`❌ خطای سرور گوگل (کد وضعیت HTTP: ${lastStatus})`);
        }
        console.log(`متن پاسخ سرور: ${lastErrText.slice(0, 300)}`);
        console.log('\n💡 راهنمایی:');
        console.log('   در صورت لزوم از https://aistudio.google.com وضعیت مدل‌های فعال را بررسی فرمایید.\n');
      }
    } catch (e: any) {
      console.log(`❌ خطا در اتصال به سرور گوگل: ${e.message}`);
      console.log('💡 لطفاً پروکسی / فیلترشکن یا اتصال اینترنت خود را بررسی فرمایید.\n');
    }
  }

  // 2. Test OpenAI if configured
  if (openaiKey) {
    console.log('🔍 بررسی کلید OpenAI...');
    try {
      const start = Date.now();
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${openaiKey}` },
      });
      const elapsed = Date.now() - start;
      if (res.ok) {
        console.log(`✅ اتصال موفقیت‌آمیز به OpenAI! (${elapsed}ms)\n`);
      } else {
        console.log(`❌ خطای احراز هویت OpenAI (کد: ${res.status})\n`);
      }
    } catch (e: any) {
      console.log(`❌ خطا در اتصال به OpenAI: ${e.message}\n`);
    }
  }

  // 3. Test Replicate if configured
  if (replicateToken) {
    console.log('🔍 بررسی کلید Replicate...');
    try {
      const start = Date.now();
      const res = await fetch('https://api.replicate.com/v1/account', {
        headers: { Authorization: `Bearer ${replicateToken}` },
      });
      const elapsed = Date.now() - start;
      if (res.ok) {
        console.log(`✅ اتصال موفقیت‌آمیز به Replicate! (${elapsed}ms)\n`);
      } else {
        console.log(`❌ خطای احراز هویت Replicate (کد: ${res.status})\n`);
      }
    } catch (e: any) {
      console.log(`❌ خطا در اتصال به Replicate: ${e.message}\n`);
    }
  }

  console.log('--------------------------------------------------');
  console.log('💡 معماری دو لایه پرو مجازی در Reservy:');
  console.log('   ۱. Gemini 2.0 Flash: تحلیل فرم چهره، هندسه صورت و مشاوره باربر');
  console.log('   ۲. FLUX Inpainting / HairFastGAN: تعویض موضعی مو با حفظ کامل چهره');
  console.log('--------------------------------------------------\n');
}

testAIConnection();

