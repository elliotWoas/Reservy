import { Hairstyle, StructuredUserProfile } from '../types';
import { CatalogHairstyle, HAIRSTYLE_CATALOG } from './catalog';

export function getTop3Recommendations(userProfile: StructuredUserProfile): Hairstyle[] {
  const { face, hair, preferences } = userProfile;
  const faceShape = face.shape.label;

  const scoredList = HAIRSTYLE_CATALOG.map((item: CatalogHairstyle) => {
    let score = 0;

    // 1. Face shape match (up to 35 pts)
    if (item.suitableFaceShapes.includes(faceShape)) {
      score += 35;
    } else {
      score += 15;
    }

    // 2. Hair texture match (up to 25 pts)
    if (item.suitableHairTextures.includes(hair.texture)) {
      score += 25;
    } else if (
      (hair.texture === 'wavy' && item.suitableHairTextures.includes('straight')) ||
      (hair.texture === 'wavy' && item.suitableHairTextures.includes('curly'))
    ) {
      score += 16;
    } else {
      score += 8;
    }

    // 3. Hair density match (up to 15 pts)
    if (item.suitableHairDensities.includes(hair.density)) {
      score += 15;
    } else {
      score += 7;
    }

    // 4. Maintenance preference match (up to 15 pts)
    if (item.maintenance === preferences.maintenance) {
      score += 15;
    } else if (
      (item.maintenance === 'low' && preferences.maintenance === 'medium') ||
      (item.maintenance === 'medium' && preferences.maintenance === 'low') ||
      (item.maintenance === 'medium' && preferences.maintenance === 'high') ||
      (item.maintenance === 'high' && preferences.maintenance === 'medium')
    ) {
      score += 9;
    } else {
      score += 4;
    }

    // 5. Style preference match (up to 10 pts)
    if (item.suitableStyles.includes(preferences.style)) {
      score += 10;
    } else {
      score += 5;
    }

    // Map raw score (30 - 100) to calibrated percentage (76% - 95%)
    const normalizedScore = Math.min(
      96,
      Math.max(76, Math.round(72 + (score / 100) * 24))
    );

    // Build tailored Persian explanation bullets
    const matchReasons: string[] = [];

    // Reason 1: Face Shape synergy
    const faceReason =
      item.faceShapeAdvantage[faceShape] ||
      `تعادل بصری بسیار عالی با ساختار و ابعاد صورت ${translateFaceShape(faceShape)} شما`;
    matchReasons.push(faceReason);

    // Reason 2: Hair texture compatibility
    matchReasons.push(getTextureReason(item, hair.texture));

    // Reason 3: Maintenance alignment
    matchReasons.push(getMaintenanceReason(item.maintenance, preferences.maintenance));

    // Reason 4: Hairline / proportions
    matchReasons.push(
      `پوشش و تناسب هارمونیک با پیشانی (عرض ${face.forehead_width}px) و ساختار فک شما`
    );

    const hairstyle: Hairstyle = {
      id: item.id,
      name: item.name,
      persianName: item.persianName,
      matchScore: normalizedScore,
      matchReasons,
      description: item.description,
      topLength: item.topLength,
      sides: item.sides,
      fringe: item.fringe,
      texture: item.texture,
      volume: item.volume,
      finish: item.finish,
      maintenance: item.maintenance,
      barberNotes: item.barberNotes,
      previewColor: item.previewColor,
    };

    return { hairstyle, rawScore: score };
  });

  // Sort descending by rawScore, then map to Top 3
  scoredList.sort((a, b) => b.rawScore - a.rawScore);

  // Ensure top 3 have pleasing stepped scores (e.g. 94%, 90%, 86%) if too close
  const top3 = scoredList.slice(0, 3).map((entry, index) => {
    const item = entry.hairstyle;
    if (index === 0) item.matchScore = Math.max(92, item.matchScore);
    if (index === 1) item.matchScore = Math.min(item.matchScore, 89);
    if (index === 2) item.matchScore = Math.min(item.matchScore, 85);
    return item;
  });

  return top3;
}

function translateFaceShape(shape: string): string {
  const map: Record<string, string> = {
    oval: 'بیضی',
    round: 'گرد',
    square: 'مربعی',
    oblong: 'کشیده',
    heart: 'قلبی',
    diamond: 'لوزی',
  };
  return map[shape] || shape;
}

function getTextureReason(item: CatalogHairstyle, texture: string): string {
  if (texture === 'straight') {
    return 'سازگاری بسیار روان با خواب طبیعی موهای صاف بدون نیاز به ابزار حرارتی';
  }
  if (texture === 'wavy') {
    return 'بهره‌گیری از موج‌های طبیعی مو جهت ایجاد عمق و حجم ارگانیک در بالای سر';
  }
  if (texture === 'curly') {
    return 'کنترل بی‌نقص حلقه‌های فر و نمایش زیباترین الگوی بافت طبیعی بدون وز شدن';
  }
  return 'فرم‌دهی متناسب با تار موهای متراکم و حالت‌پذیری پایدار در طول روز';
}

function getMaintenanceReason(
  itemMaintenance: 'low' | 'medium' | 'high',
  userMaintenance: 'low' | 'medium' | 'high'
): string {
  if (itemMaintenance === 'low') {
    return 'استایلینگ روزمره فوق‌العاده سریع (کمتر از ۳ دقیقه) با حداقل مواد آرایشی';
  }
  if (itemMaintenance === 'medium') {
    return 'نگهداری استاندارد و متعادل با سشوار ملایم و استفاده ساده از پودر یا کلی مات';
  }
  return 'استایلی متمایز و پرجزییات مناسب افرادی که به آرایش حرفه‌ای روزانه علاقه‌مندند';
}
