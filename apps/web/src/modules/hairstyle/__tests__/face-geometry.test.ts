import { describe, it, expect } from 'bun:test';
import { calculateFaceGeometry, euclideanDistance } from '../analysis/face-geometry';
import { FaceLandmarks } from '../types';

describe('Face Geometry Calculations', () => {
  it('calculates euclidean distance accurately', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(euclideanDistance(p1, p2)).toBe(5);
  });

  it('calculates facial anthropometric metrics from landmarks', () => {
    const mockLandmarks: FaceLandmarks = {
      leftEye: { x: 80, y: 110 },
      rightEye: { x: 160, y: 110 },
      noseTip: { x: 120, y: 150 },
      mouthCenter: { x: 120, y: 190 },
      chin: { x: 120, y: 240 },
      foreheadCenter: { x: 120, y: 30 },
      leftCheek: { x: 40, y: 140 },
      rightCheek: { x: 200, y: 140 },
      leftJaw: { x: 50, y: 200 },
      rightJaw: { x: 190, y: 200 },
    };

    const geometry = calculateFaceGeometry(mockLandmarks);

    expect(geometry.height).toBe(210); // 240 - 30
    expect(geometry.cheekboneWidth).toBe(160); // 200 - 40
    expect(geometry.jawWidth).toBe(140); // 190 - 50
    expect(geometry.foreheadWidth).toBe(144); // (160 - 80) * 1.8 = 144
    expect(geometry.aspectRatio).toBeGreaterThan(0.7);
    expect(geometry.ratios.heightToWidth).toBeGreaterThan(1.2);
    expect(geometry.ratios.cheekboneToJaw).toBeGreaterThan(1.1);
  });
});
