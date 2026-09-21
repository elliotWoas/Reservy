import { describe, it, expect } from 'bun:test';
import { classifyFaceShape } from '../analysis/face-shape';
import { FaceGeometry } from '../types';

describe('Face Shape Classifier', () => {
  it('accurately classifies an oval face geometry with high confidence', () => {
    const ovalGeometry: FaceGeometry = {
      width: 170,
      height: 235,
      aspectRatio: 0.723,
      foreheadWidth: 158,
      cheekboneWidth: 170,
      jawWidth: 140,
      ratios: {
        foreheadToJaw: 1.129,
        cheekboneToJaw: 1.214,
        heightToWidth: 1.382,
      },
    };

    const result = classifyFaceShape(ovalGeometry);
    expect(result.label).toBe('oval');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.candidateScores.oval).toBeGreaterThan(result.candidateScores.round);
  });

  it('accurately classifies a square face geometry with equal proportions', () => {
    const squareGeometry: FaceGeometry = {
      width: 190,
      height: 215,
      aspectRatio: 0.884,
      foreheadWidth: 184,
      cheekboneWidth: 190,
      jawWidth: 182,
      ratios: {
        foreheadToJaw: 1.011,
        cheekboneToJaw: 1.044,
        heightToWidth: 1.132,
      },
    };

    const result = classifyFaceShape(squareGeometry);
    expect(result.label).toBe('square');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('accurately classifies an oblong face geometry with high length-to-width ratio', () => {
    const oblongGeometry: FaceGeometry = {
      width: 155,
      height: 250,
      aspectRatio: 0.62,
      foreheadWidth: 150,
      cheekboneWidth: 155,
      jawWidth: 142,
      ratios: {
        foreheadToJaw: 1.056,
        cheekboneToJaw: 1.092,
        heightToWidth: 1.613,
      },
    };

    const result = classifyFaceShape(oblongGeometry);
    expect(result.label).toBe('oblong');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('accurately classifies a heart face geometry with wide forehead and narrow jaw', () => {
    const heartGeometry: FaceGeometry = {
      width: 175,
      height: 230,
      aspectRatio: 0.761,
      foreheadWidth: 180,
      cheekboneWidth: 175,
      jawWidth: 125,
      ratios: {
        foreheadToJaw: 1.44,
        cheekboneToJaw: 1.4,
        heightToWidth: 1.314,
      },
    };

    const result = classifyFaceShape(heartGeometry);
    expect(result.label).toBe('heart');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('accurately classifies a diamond face geometry with dominant cheekbones', () => {
    const diamondGeometry: FaceGeometry = {
      width: 195,
      height: 245,
      aspectRatio: 0.796,
      foreheadWidth: 148,
      cheekboneWidth: 195,
      jawWidth: 135,
      ratios: {
        foreheadToJaw: 1.096,
        cheekboneToJaw: 1.444,
        heightToWidth: 1.256,
      },
    };

    const result = classifyFaceShape(diamondGeometry);
    expect(result.label).toBe('diamond');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });
});
