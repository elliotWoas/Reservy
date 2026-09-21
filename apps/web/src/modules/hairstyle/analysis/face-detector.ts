import { BoundingBox, FaceLandmarks } from '../types';

export interface FaceDetectionResult {
  detected: boolean;
  boundingBox?: BoundingBox;
  landmarks?: FaceLandmarks;
  confidence: number;
}

export function isSkinPixel(r: number, g: number, b: number): boolean {
  // Convert to YCbCr
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // YCbCr skin chrominance cluster covers all human skin tones
  const inYCbCr = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
  // Normalized RGB heuristic for shadow & highlight robustness
  const inRgb = r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 10;

  return inYCbCr || inRgb;
}

export function detectFaceInCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
): FaceDetectionResult {
  const ctx = context || (canvas.getContext('2d') as CanvasRenderingContext2D | null);
  if (!ctx) {
    return { detected: false, confidence: 0 };
  }

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Downsample to grid for fast centroid & bounding discovery
  const gridW = 80;
  const gridH = 80;
  const cellW = width / gridW;
  const cellH = height / gridH;

  const skinDensity = new Uint16Array(gridW * gridH);
  let totalSkinCount = 0;

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const startX = Math.floor(gx * cellW);
      const startY = Math.floor(gy * cellH);
      let count = 0;

      // Sample a few pixels in each cell
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          const px = Math.min(width - 1, startX + Math.floor((sx * cellW) / 4));
          const py = Math.min(height - 1, startY + Math.floor((sy * cellH) / 4));
          const idx = (py * width + px) * 4;
          if (isSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
            count++;
          }
        }
      }

      skinDensity[gy * gridW + gx] = count;
      totalSkinCount += count;
    }
  }

  // If insufficient skin detected (< 120 pixels in grid), no face is clearly present
  if (totalSkinCount < 120) {
    return { detected: false, confidence: 0.1 };
  }

  // Find bounding box containing the core skin cluster in the upper/center 75% of the frame
  let minGx = gridW;
  let maxGx = 0;
  let minGy = gridH;
  let maxGy = 0;
  let clusterSkinCount = 0;

  for (let gy = 5; gy < gridH - 5; gy++) {
    for (let gx = 5; gx < gridW - 5; gx++) {
      if (skinDensity[gy * gridW + gx] >= 6) {
        minGx = Math.min(minGx, gx);
        maxGx = Math.max(maxGx, gx);
        minGy = Math.min(minGy, gy);
        maxGy = Math.max(maxGy, gy);
        clusterSkinCount++;
      }
    }
  }

  if (clusterSkinCount < 30 || maxGx <= minGx || maxGy <= minGy) {
    return { detected: false, confidence: 0.2 };
  }

  // Convert grid coordinates back to full image pixels
  const boxX = Math.floor(minGx * cellW);
  const boxY = Math.floor(minGy * cellH);
  const boxWidth = Math.floor((maxGx - minGx + 1) * cellW);
  const boxHeight = Math.floor((maxGy - minGy + 1) * cellH);

  // Filter out non-face aspect ratios (a face box is typically aspect ratio 0.65 to 1.35)
  const boxRatio = boxWidth / (boxHeight || 1);
  if (boxRatio < 0.5 || boxRatio > 1.6) {
    return { detected: false, confidence: 0.25 };
  }

  const boundingBox: BoundingBox = {
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
  };

  // Find refined eye line by scanning horizontal gradient/valleys around 32% - 46% of box height
  const eyeSearchTop = Math.floor(boxY + boxHeight * 0.32);
  const eyeSearchBottom = Math.floor(boxY + boxHeight * 0.46);
  let bestEyeY = Math.floor(boxY + boxHeight * 0.38);
  let lowestEyeLum = Infinity;

  for (let y = eyeSearchTop; y <= eyeSearchBottom; y += 2) {
    let rowLum = 0;
    const sampleWidth = Math.floor(boxWidth * 0.6);
    const startX = Math.floor(boxX + boxWidth * 0.2);

    for (let x = startX; x < startX + sampleWidth; x += 4) {
      const idx = (y * width + x) * 4;
      rowLum += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
    if (rowLum < lowestEyeLum) {
      lowestEyeLum = rowLum;
      bestEyeY = y;
    }
  }

  // Refine left & right eye positions along bestEyeY
  const leftEyeRegionX = Math.floor(boxX + boxWidth * 0.28);
  const rightEyeRegionX = Math.floor(boxX + boxWidth * 0.72);

  const landmarks: FaceLandmarks = {
    leftEye: {
      x: leftEyeRegionX,
      y: bestEyeY,
    },
    rightEye: {
      x: rightEyeRegionX,
      y: bestEyeY,
    },
    noseTip: {
      x: Math.floor(boxX + boxWidth * 0.5),
      y: Math.floor(boxY + boxHeight * 0.58),
    },
    mouthCenter: {
      x: Math.floor(boxX + boxWidth * 0.5),
      y: Math.floor(boxY + boxHeight * 0.75),
    },
    chin: {
      x: Math.floor(boxX + boxWidth * 0.5),
      y: Math.floor(boxY + boxHeight * 0.98),
    },
    foreheadCenter: {
      x: Math.floor(boxX + boxWidth * 0.5),
      y: Math.floor(boxY + boxHeight * 0.08),
    },
    leftCheek: {
      x: Math.floor(boxX + boxWidth * 0.14),
      y: Math.floor(boxY + boxHeight * 0.52),
    },
    rightCheek: {
      x: Math.floor(boxX + boxWidth * 0.86),
      y: Math.floor(boxY + boxHeight * 0.52),
    },
    leftJaw: {
      x: Math.floor(boxX + boxWidth * 0.2),
      y: Math.floor(boxY + boxHeight * 0.82),
    },
    rightJaw: {
      x: Math.floor(boxX + boxWidth * 0.8),
      y: Math.floor(boxY + boxHeight * 0.82),
    },
  };

  const confidence = Number(
    Math.min(0.95, Math.max(0.7, 0.7 + (clusterSkinCount / (gridW * gridH)) * 0.5)).toFixed(2)
  );

  return {
    detected: true,
    boundingBox,
    landmarks,
    confidence,
  };
}
