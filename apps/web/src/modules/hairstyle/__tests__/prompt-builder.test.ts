import { describe, it, expect } from 'bun:test';
import { buildIdentityPreservingPrompt } from '../try-on/prompt-builder';
import { Hairstyle, StructuredUserProfile } from '../types';

describe('Prompt Builder for Image-Editing AI APIs', () => {
  const mockProfile: StructuredUserProfile = {
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

  const mockHairstyle: Hairstyle = {
    id: 'textured-crop',
    name: 'Textured Crop',
    persianName: 'کراپ بافت‌دار',
    matchScore: 94,
    matchReasons: ['تناسب با چهره بیضی'],
    description: 'مدل موی کوتاه جلو بافت‌دار',
    topLength: '۴ تا ۶ سانتی‌متر',
    sides: 'Low Taper Fade',
    fringe: 'Short Forward',
    texture: 'Heavy Matte',
    volume: 'Medium',
    finish: 'Natural Matte',
    maintenance: 'low',
    barberNotes: 'فید ملایم در شقیقه',
  };

  it('generates prompt with strict identity preservation constraints', () => {
    const { prompt, negativePrompt } = buildIdentityPreservingPrompt(mockProfile, mockHairstyle);

    // Checks identity preservation constraints
    expect(prompt).toContain('CRITICAL IDENTITY PRESERVATION REQUIREMENTS');
    expect(prompt).toContain('Keep the exact same person');
    expect(prompt).toContain('PRESERVE 100% UNCHANGED');
    expect(prompt).toContain('eyes');
    expect(prompt).toContain('nose');
    expect(prompt).toContain('lips');
    expect(prompt).toContain('jawline');
    expect(prompt).toContain('skin tone');

    // Checks hairstyle attributes
    expect(prompt).toContain('Textured Crop');
    expect(prompt).toContain('Low Taper Fade');
    expect(prompt).toContain('Short Forward');

    // Checks negative prompt contains distortion protections
    expect(negativePrompt).toContain('different person');
    expect(negativePrompt).toContain('altered facial features');
    expect(negativePrompt).toContain('distorted eyes');
  });
});
