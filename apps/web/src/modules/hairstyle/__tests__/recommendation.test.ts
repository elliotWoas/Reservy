import { describe, it, expect } from 'bun:test';
import { getTop3Recommendations } from '../recommendation/recommender';
import { StructuredUserProfile } from '../types';

describe('Hairstyle Recommendation Engine', () => {
  const baseProfile: StructuredUserProfile = {
    capture: {
      front: true,
      left: true,
      right: true,
      quality: 'good',
    },
    face: {
      shape: {
        label: 'oval',
        confidence: 0.88,
      },
      width: 175,
      height: 232,
      aspect_ratio: 0.754,
      forehead_width: 156,
      cheekbone_width: 175,
      jaw_width: 148,
    },
    pose: {
      front: 'valid',
      left: 'valid',
      right: 'valid',
    },
    hair: {
      texture: 'wavy',
      density: 'medium',
      length: 'medium',
      hairline: 'normal',
    },
    preferences: {
      maintenance: 'low',
      style: 'modern',
    },
  };

  it('returns exactly Top 3 recommendations', () => {
    const recommendations = getTop3Recommendations(baseProfile);
    expect(recommendations).toHaveLength(3);
  });

  it('sorts recommendations in descending order of matchScore', () => {
    const recommendations = getTop3Recommendations(baseProfile);
    expect(recommendations[0].matchScore).toBeGreaterThanOrEqual(recommendations[1].matchScore);
    expect(recommendations[1].matchScore).toBeGreaterThanOrEqual(recommendations[2].matchScore);
  });

  it('populates rich structured attributes and tailored match reasons', () => {
    const recommendations = getTop3Recommendations(baseProfile);
    const topPick = recommendations[0];

    expect(topPick.id).toBeDefined();
    expect(topPick.name).toBeDefined();
    expect(topPick.persianName).toBeDefined();
    expect(topPick.topLength).toBeDefined();
    expect(topPick.sides).toBeDefined();
    expect(topPick.barberNotes).toBeDefined();
    expect(topPick.matchReasons.length).toBeGreaterThanOrEqual(3);
    // Reasons contain Persian text
    expect(topPick.matchReasons[0].length).toBeGreaterThan(10);
  });

  it('adapts recommendations when face shape and preferences change', () => {
    const squareProfile: StructuredUserProfile = {
      ...baseProfile,
      face: {
        ...baseProfile.face,
        shape: {
          label: 'square',
          confidence: 0.92,
        },
      },
      hair: {
        texture: 'curly',
        density: 'high',
        length: 'short',
        hairline: 'normal',
      },
      preferences: {
        maintenance: 'low',
        style: 'clean',
      },
    };

    const recommendations = getTop3Recommendations(squareProfile);
    expect(recommendations).toHaveLength(3);
    // Should favor clean/short styles for square faces such as Buzz Cut / Low Taper
    const ids = recommendations.map((r) => r.id);
    expect(ids.some((id) => id.includes('buzz') || id.includes('taper') || id.includes('crop'))).toBe(true);
  });
});
