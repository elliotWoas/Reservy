import { describe, it, expect } from 'bun:test';
import { estimateHeadPose } from '../analysis/pose-estimator';
import { FaceLandmarks } from '../types';

describe('Head Pose Estimator', () => {
  it('validates centered front-facing pose', () => {
    const frontLandmarks: FaceLandmarks = {
      leftEye: { x: 90, y: 120 },
      rightEye: { x: 170, y: 120 },
      noseTip: { x: 130, y: 155 }, // (130 - 90) / (170 - 90) = 40/80 = 0.50 => yaw = 0
      mouthCenter: { x: 130, y: 190 },
      chin: { x: 130, y: 220 },
      foreheadCenter: { x: 130, y: 50 },
      leftCheek: { x: 60, y: 150 },
      rightCheek: { x: 200, y: 150 },
      leftJaw: { x: 70, y: 195 },
      rightJaw: { x: 190, y: 195 },
    };

    const pose = estimateHeadPose(frontLandmarks, 'front');
    expect(pose.isValidForAngle).toBe(true);
    expect(pose.angleStatus).toBe('valid');
    expect(Math.abs(pose.yaw)).toBeLessThanOrEqual(5);
  });

  it('validates left turned profile pose', () => {
    const leftTurnedLandmarks: FaceLandmarks = {
      leftEye: { x: 80, y: 120 },
      rightEye: { x: 160, y: 120 },
      noseTip: { x: 98, y: 155 }, // (98 - 80) / 80 = 18/80 = 0.225 => yaw ~ -33
      mouthCenter: { x: 105, y: 190 },
      chin: { x: 110, y: 220 },
      foreheadCenter: { x: 115, y: 50 },
      leftCheek: { x: 60, y: 150 },
      rightCheek: { x: 180, y: 150 },
      leftJaw: { x: 70, y: 195 },
      rightJaw: { x: 170, y: 195 },
    };

    const pose = estimateHeadPose(leftTurnedLandmarks, 'left');
    expect(pose.isValidForAngle).toBe(true);
    expect(pose.yaw).toBeLessThan(-20);
    expect(pose.angleStatus).toBe('valid');
  });

  it('validates right turned profile pose', () => {
    const rightTurnedLandmarks: FaceLandmarks = {
      leftEye: { x: 80, y: 120 },
      rightEye: { x: 160, y: 120 },
      noseTip: { x: 142, y: 155 }, // (142 - 80) / 80 = 62/80 = 0.775 => yaw ~ +33
      mouthCenter: { x: 135, y: 190 },
      chin: { x: 130, y: 220 },
      foreheadCenter: { x: 125, y: 50 },
      leftCheek: { x: 60, y: 150 },
      rightCheek: { x: 180, y: 150 },
      leftJaw: { x: 70, y: 195 },
      rightJaw: { x: 170, y: 195 },
    };

    const pose = estimateHeadPose(rightTurnedLandmarks, 'right');
    expect(pose.isValidForAngle).toBe(true);
    expect(pose.yaw).toBeGreaterThan(20);
    expect(pose.angleStatus).toBe('valid');
  });
});
