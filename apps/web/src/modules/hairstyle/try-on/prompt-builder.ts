import { Hairstyle, StructuredUserProfile } from '../types';

export interface BuiltPrompts {
  prompt: string;
  negativePrompt: string;
  hairMaskInstructions: string;
}

export function buildIdentityPreservingPrompt(
  userProfile: StructuredUserProfile,
  hairstyle: Hairstyle
): BuiltPrompts {
  const { face, hair } = userProfile;

  const prompt = [
    `Professional portrait photograph of the exact same man in the photo, with his hairstyle changed to a modern ${hairstyle.name} haircut.`,
    `Hairstyle specifications:`,
    `- Top length: ${hairstyle.topLength}`,
    `- Sides and back: ${hairstyle.sides}`,
    `- Fringe styling: ${hairstyle.fringe}`,
    `- Hair texture: ${hairstyle.texture}, natural hair texture compatible with ${hair.texture} hair`,
    `- Volume & finish: ${hairstyle.volume}, ${hairstyle.finish}`,
    `Hairline and integration:`,
    `- Natural transition along the forehead hairline adapted to face shape: ${face.shape.label}`,
    `- Consistent natural hair color matching original roots and eyebrow tone`,
    `CRITICAL IDENTITY PRESERVATION REQUIREMENTS:`,
    `- Keep the exact same person, exact same facial features, bone structure, and identity.`,
    `- PRESERVE 100% UNCHANGED: eyes, eye shape, pupils, eyebrows, nose, nostrils, mouth, lips, chin, jawline, ears, skin tone, skin texture, moles, beard and facial hair.`,
    `- Retain original lighting, head angle, camera perspective, and background seamlessly.`,
    `- Do NOT beautify, do NOT modify facial proportions, do NOT change age, do NOT generate a different person.`,
    `- Photorealistic, 8k resolution, razor-sharp barber haircut finish.`,
  ].join(' ');

  const negativePrompt = [
    'different person, altered facial features, distorted eyes, changed nose, different lips, modified jawline,',
    'plastic skin, overly airbrushed, cartoon, CGI, 3D render, drawing, anime, watermark, artifacts, blurry face,',
    'wrong hairline, floating hair, disconnected scalp, feminine hair, shaved eyebrows, changed skin color, unnatural shadows',
  ].join(' ');

  const hairMaskInstructions =
    'Mask only the hair region above the forehead hairline and around the temples and neck. Protect the entire face polygon from eyebrows down to chin.';

  return {
    prompt,
    negativePrompt,
    hairMaskInstructions,
  };
}
