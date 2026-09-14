import { FaceGeometry, FaceLandmarks } from '../types';

export function euclideanDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateFaceGeometry(landmarks: FaceLandmarks): FaceGeometry {
  // Forehead width: distance between temple regions (estimated from cheek and forehead center)
  // or distance between left and right upper edges
  const foreheadWidth = Math.round(
    euclideanDistance(
      { x: landmarks.foreheadCenter.x - (landmarks.rightEye.x - landmarks.leftEye.x) * 0.9, y: landmarks.foreheadCenter.y },
      { x: landmarks.foreheadCenter.x + (landmarks.rightEye.x - landmarks.leftEye.x) * 0.9, y: landmarks.foreheadCenter.y }
    )
  );

  // Cheekbone width: distance between widest cheek points
  const cheekboneWidth = Math.round(euclideanDistance(landmarks.leftCheek, landmarks.rightCheek));

  // Jaw width: distance between mandibular angles
  const jawWidth = Math.round(euclideanDistance(landmarks.leftJaw, landmarks.rightJaw));

  // Face height: distance from forehead center / hairline to chin tip
  const height = Math.round(euclideanDistance(landmarks.foreheadCenter, landmarks.chin));

  // Face width: maximum of cheekbone width, forehead width, or eye span
  const width = Math.max(cheekboneWidth, Math.round(jawWidth * 1.05));

  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const safeJaw = Math.max(1, jawWidth);

  const aspectRatio = Number((safeWidth / safeHeight).toFixed(3));
  const foreheadToJaw = Number((foreheadWidth / safeJaw).toFixed(3));
  const cheekboneToJaw = Number((cheekboneWidth / safeJaw).toFixed(3));
  const heightToWidth = Number((safeHeight / safeWidth).toFixed(3));

  return {
    width: safeWidth,
    height: safeHeight,
    aspectRatio,
    foreheadWidth,
    cheekboneWidth,
    jawWidth,
    ratios: {
      foreheadToJaw,
      cheekboneToJaw,
      heightToWidth,
    },
  };
}
