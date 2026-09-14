import { FaceGeometry, FaceShapeEstimate, FaceShapeType } from '../types';

export function classifyFaceShape(geometry: FaceGeometry): FaceShapeEstimate {
  const { aspectRatio, ratios, foreheadWidth, cheekboneWidth, jawWidth } = geometry;
  const { heightToWidth, foreheadToJaw, cheekboneToJaw } = ratios;

  const rawScores: Record<FaceShapeType, number> = {
    oval: 0,
    round: 0,
    square: 0,
    oblong: 0,
    heart: 0,
    diamond: 0,
  };

  // 1. Oval evaluation:
  // Balanced: height is moderately greater than width (heightToWidth: 1.28 - 1.52)
  // Forehead is slightly wider than jaw (foreheadToJaw: 1.05 - 1.30)
  // Cheekbones are balanced
  if (heightToWidth >= 1.25 && heightToWidth <= 1.55) {
    rawScores.oval += 45;
  } else if (heightToWidth >= 1.18 && heightToWidth <= 1.62) {
    rawScores.oval += 25;
  }
  if (foreheadToJaw >= 1.05 && foreheadToJaw <= 1.30) {
    rawScores.oval += 35;
  }
  if (cheekboneToJaw >= 1.08 && cheekboneToJaw <= 1.28) {
    rawScores.oval += 20;
  }

  // 2. Round evaluation:
  // Short/wide face: heightToWidth < 1.25
  // Cheekbones are the widest part: cheekboneToJaw >= 1.18
  // Soft difference between forehead and jaw
  if (heightToWidth < 1.25) {
    rawScores.round += 40;
  } else if (heightToWidth < 1.32) {
    rawScores.round += 20;
  }
  if (cheekboneToJaw >= 1.18) {
    rawScores.round += 35;
  }
  if (Math.abs(foreheadToJaw - 1.0) < 0.15) {
    rawScores.round += 25;
  }

  // 3. Square evaluation:
  // Short/wide: heightToWidth < 1.26
  // Forehead, cheekbone, and jaw are nearly equal (foreheadToJaw: 0.95 - 1.12, cheekboneToJaw: 0.98 - 1.14)
  if (heightToWidth < 1.26) {
    rawScores.square += 35;
  }
  if (foreheadToJaw >= 0.92 && foreheadToJaw <= 1.15) {
    rawScores.square += 35;
  }
  if (cheekboneToJaw >= 0.95 && cheekboneToJaw <= 1.16) {
    rawScores.square += 30;
  }

  // 4. Oblong / Rectangle evaluation:
  // Height significantly exceeds width: heightToWidth > 1.52
  // Forehead and jaw are moderately similar in width
  if (heightToWidth > 1.52) {
    rawScores.oblong += 55;
  } else if (heightToWidth > 1.42) {
    rawScores.oblong += 25;
  }
  if (foreheadToJaw >= 0.95 && foreheadToJaw <= 1.25) {
    rawScores.oblong += 30;
  }
  if (aspectRatio < 0.72) {
    rawScores.oblong += 15;
  }

  // 5. Heart evaluation:
  // Forehead is significantly wider than jaw: foreheadToJaw > 1.28
  // Narrow chin/jaw: cheekboneToJaw > 1.22
  if (foreheadToJaw > 1.28) {
    rawScores.heart += 50;
  } else if (foreheadToJaw > 1.20) {
    rawScores.heart += 25;
  }
  if (cheekboneToJaw > 1.22) {
    rawScores.heart += 30;
  }
  if (jawWidth < cheekboneWidth * 0.82) {
    rawScores.heart += 20;
  }

  // 6. Diamond evaluation:
  // Cheekbones are distinctly the widest feature
  // Both forehead and jaw are narrower than cheekbones
  const isCheekboneDominant =
    cheekboneWidth > foreheadWidth * 1.12 && cheekboneWidth > jawWidth * 1.22;
  if (isCheekboneDominant) {
    rawScores.diamond += 60;
  }
  if (cheekboneToJaw > 1.25) {
    rawScores.diamond += 25;
  }
  if (heightToWidth >= 1.25 && heightToWidth <= 1.50) {
    rawScores.diamond += 15;
  }

  // Normalize scores into probabilities (0 to 1)
  const totalScore = Object.values(rawScores).reduce((acc, score) => acc + Math.max(1, score), 0);
  const candidateScores: Record<FaceShapeType, number> = {
    oval: Number((Math.max(1, rawScores.oval) / totalScore).toFixed(3)),
    round: Number((Math.max(1, rawScores.round) / totalScore).toFixed(3)),
    square: Number((Math.max(1, rawScores.square) / totalScore).toFixed(3)),
    oblong: Number((Math.max(1, rawScores.oblong) / totalScore).toFixed(3)),
    heart: Number((Math.max(1, rawScores.heart) / totalScore).toFixed(3)),
    diamond: Number((Math.max(1, rawScores.diamond) / totalScore).toFixed(3)),
  };

  // Find winner
  let bestLabel: FaceShapeType = 'oval';
  let highestScore = -1;

  for (const [key, score] of Object.entries(candidateScores)) {
    if (score > highestScore) {
      highestScore = score;
      bestLabel = key as FaceShapeType;
    }
  }

  // Confidence formula: scale dominant score relative to competitors
  const sortedScores = Object.values(candidateScores).sort((a, b) => b - a);
  const runnerUp = sortedScores[1] || 0;
  const margin = highestScore - runnerUp;
  // Bound confidence between 0.65 and 0.96 for honest representation
  const confidence = Number(Math.min(0.96, Math.max(0.65, 0.66 + margin * 0.95)).toFixed(2));

  return {
    label: bestLabel,
    confidence,
    candidateScores,
  };
}
