import { BoundingBox, ImageQualityMetrics } from '../types';

export function assessImageQuality(
  imageData: ImageData,
  faceBox?: BoundingBox
): ImageQualityMetrics {
  const { data, width, height } = imageData;
  const feedback: string[] = [];

  // 1. Calculate Average Luminance (Brightness)
  let totalLuminance = 0;
  const pixelCount = width * height;
  const step = Math.max(1, Math.floor(pixelCount / 10000)); // Sample ~10k pixels for performance
  let sampledCount = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Standard perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;
    sampledCount++;
  }

  const brightness = Math.round(totalLuminance / (sampledCount || 1));
  let isBrightnessAcceptable = true;

  if (brightness < 45) {
    isBrightnessAcceptable = false;
    feedback.push('نور محیط کم است. لطفاً در محیط روشن‌تر عکس بگیرید.');
  } else if (brightness > 225) {
    isBrightnessAcceptable = false;
    feedback.push('نور بسیار شدید است و چهره محو شده است.');
  }

  // 2. Calculate Sharpness via Laplacian Variance on Luminance
  // We compute on a center-focused or face-bounded grid
  const subStartX = faceBox ? Math.max(1, Math.floor(faceBox.x)) : Math.floor(width * 0.2);
  const subEndX = faceBox ? Math.min(width - 2, Math.floor(faceBox.x + faceBox.width)) : Math.floor(width * 0.8);
  const subStartY = faceBox ? Math.max(1, Math.floor(faceBox.y)) : Math.floor(height * 0.2);
  const subEndY = faceBox ? Math.min(height - 2, Math.floor(faceBox.y + faceBox.height)) : Math.floor(height * 0.8);

  let laplacianSum = 0;
  let laplacianSqSum = 0;
  let laplacianPoints = 0;
  const lapStep = 2; // Step by 2 pixels for speed

  for (let y = subStartY; y < subEndY; y += lapStep) {
    for (let x = subStartX; x < subEndX; x += lapStep) {
      const idx = (y * width + x) * 4;
      const idxUp = ((y - 1) * width + x) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      const idxLeft = (y * width + (x - 1)) * 4;
      const idxRight = (y * width + (x + 1)) * 4;

      const c = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const u = 0.299 * data[idxUp] + 0.587 * data[idxUp + 1] + 0.114 * data[idxUp + 2];
      const d = 0.299 * data[idxDown] + 0.587 * data[idxDown + 1] + 0.114 * data[idxDown + 2];
      const l = 0.299 * data[idxLeft] + 0.587 * data[idxLeft + 1] + 0.114 * data[idxLeft + 2];
      const r = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];

      const lap = u + d + l + r - 4 * c;
      laplacianSum += lap;
      laplacianSqSum += lap * lap;
      laplacianPoints++;
    }
  }

  const meanLap = laplacianSum / (laplacianPoints || 1);
  const variance = laplacianSqSum / (laplacianPoints || 1) - meanLap * meanLap;
  const sharpness = Math.round(Math.max(0, variance));

  const isSharpnessAcceptable = sharpness >= 30;
  if (!isSharpnessAcceptable) {
    feedback.push('تصویر تار یا لرزش دارد. لطفاً دوربین را ثابت نگه‌دارید.');
  }

  // 3. Face Coverage and Centering
  let coverageRatio = 0.35;
  let isCoverageAcceptable = true;
  let isCentered = true;

  if (faceBox) {
    const faceArea = faceBox.width * faceBox.height;
    const totalArea = width * height;
    coverageRatio = Number((faceArea / totalArea).toFixed(3));

    if (coverageRatio < 0.08) {
      isCoverageAcceptable = false;
      feedback.push('صورت از دوربین خیلی دور است. لطفاً نزدیک‌تر شوید.');
    } else if (coverageRatio > 0.75) {
      isCoverageAcceptable = false;
      feedback.push('صورت بیش از حد به دوربین نزدیک است.');
    }

    const faceCenterX = faceBox.x + faceBox.width / 2;
    const faceCenterY = faceBox.y + faceBox.height / 2;
    const relCenterX = faceCenterX / width;
    const relCenterY = faceCenterY / height;

    if (relCenterX < 0.22 || relCenterX > 0.78 || relCenterY < 0.18 || relCenterY > 0.82) {
      isCentered = false;
      feedback.push('لطفاً صورت خود را در مرکز کادر قرار دهید.');
    }
  }

  // 4. Overall Score Calculation
  let overallScore = 100;
  if (!isBrightnessAcceptable) overallScore -= 35;
  if (!isSharpnessAcceptable) overallScore -= 35;
  if (!isCoverageAcceptable) overallScore -= 15;
  if (!isCentered) overallScore -= 15;
  overallScore = Math.max(10, overallScore);

  const isAcceptable = isBrightnessAcceptable && isSharpnessAcceptable && isCoverageAcceptable && isCentered;

  return {
    brightness,
    isBrightnessAcceptable,
    sharpness,
    isSharpnessAcceptable,
    coverageRatio,
    isCoverageAcceptable,
    isCentered,
    overallScore,
    isAcceptable,
    feedback: feedback.length > 0 ? feedback : ['کیفیت و نور تصویر بسیار مناسب است.'],
  };
}
