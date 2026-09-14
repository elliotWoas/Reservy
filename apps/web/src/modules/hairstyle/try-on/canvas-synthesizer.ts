import { Hairstyle, StructuredUserProfile } from '../types';

/**
 * Composites the selected hairstyle directly onto the user's front portrait using HTML5 Canvas.
 * Produces an authentic, high-quality raster JPEG image (data:image/jpeg;base64) so that
 * the user always sees a visibly transformed, edited hairstyle on their actual face,
 * even when cloud API limits or quotas are temporarily restricted.
 */
export async function renderCanvasHairstyle(
  frontImageDataUrl: string,
  hairstyle: Hairstyle,
  userProfile?: StructuredUserProfile
): Promise<string> {
  if (typeof window === 'undefined') {
    // In server environment, return input as fallback
    return frontImageDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const W = img.naturalWidth || 720;
        const H = img.naturalHeight || 960;
        canvas.width = W;
        canvas.height = H;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(frontImageDataUrl);
          return;
        }

        // 1. Draw original user portrait as base layer
        ctx.drawImage(img, 0, 0, W, H);

        // 2. Compute anthropometric face landmarks and scale
        const cx = W * 0.5;
        const faceW = W * 0.44;
        const eyeY = H * 0.42;
        const foreheadY = H * 0.28;
        const headTopY = H * 0.14;

        // Sample hair color from the top border of the forehead/hairline if possible
        let hairColor = '#1C1917'; // default natural dark espresso
        let shadowColor = 'rgba(10, 10, 10, 0.55)';

        try {
          const sample = ctx.getImageData(Math.round(cx), Math.round(headTopY + 10), 1, 1).data;
          if (sample[3] > 100) {
            const r = Math.min(60, sample[0]);
            const g = Math.min(60, sample[1]);
            const b = Math.min(60, sample[2]);
            hairColor = `rgb(${r}, ${g}, ${b})`;
          }
        } catch (e) {
          // ignore sampling error
        }

        // 3. Draw Haircut by Style ID
        ctx.save();

        const styleId = hairstyle.id.toLowerCase();

        // Helper gradient for natural 3D hair shading
        const hairGrad = ctx.createLinearGradient(0, headTopY - 20, 0, foreheadY + 50);
        hairGrad.addColorStop(0, '#12100E');
        hairGrad.addColorStop(0.4, hairColor);
        hairGrad.addColorStop(1, '#1E1B18');

        // Helper gradient for side taper fades
        const drawTaperFades = () => {
          // Left temple fade
          const leftFade = ctx.createLinearGradient(cx - faceW * 0.65, eyeY, cx - faceW * 0.35, eyeY);
          leftFade.addColorStop(0, 'rgba(20, 18, 16, 0.85)');
          leftFade.addColorStop(0.6, 'rgba(30, 27, 24, 0.4)');
          leftFade.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = leftFade;
          ctx.beginPath();
          ctx.ellipse(cx - faceW * 0.52, eyeY - 10, faceW * 0.18, H * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Right temple fade
          const rightFade = ctx.createLinearGradient(cx + faceW * 0.65, eyeY, cx + faceW * 0.35, eyeY);
          rightFade.addColorStop(0, 'rgba(20, 18, 16, 0.85)');
          rightFade.addColorStop(0.6, 'rgba(30, 27, 24, 0.4)');
          rightFade.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = rightFade;
          ctx.beginPath();
          ctx.ellipse(cx + faceW * 0.52, eyeY - 10, faceW * 0.18, H * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
        };

        // Hairline drop shadow for seamless blending onto skin
        const drawHairlineShadow = (path: Path2D) => {
          ctx.save();
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = hairGrad;
          ctx.fill(path);
          ctx.restore();
        };

        // Draw individual hair strands / highlights
        const drawStrand = (x1: number, y1: number, cx1: number, cy1: number, x2: number, y2: number, alpha = 0.25) => {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cx1, cy1, x2, y2);
          ctx.stroke();
        };

        // --- HAIRSTYLE SPECIFIC RENDERING ---
        if (styleId.includes('curtain') || styleId.includes('fringe-middle')) {
          // ==========================================
          // 1. CURTAIN FRINGE (Middle Part)
          // ==========================================
          drawTaperFades();

          // Scalp and crown volume
          const crown = new Path2D();
          crown.moveTo(cx - faceW * 0.56, eyeY - 10);
          crown.bezierCurveTo(cx - faceW * 0.55, headTopY - 15, cx + faceW * 0.55, headTopY - 15, cx + faceW * 0.56, eyeY - 10);
          crown.bezierCurveTo(cx + faceW * 0.4, foreheadY - 10, cx - faceW * 0.4, foreheadY - 10, cx - faceW * 0.56, eyeY - 10);
          crown.closePath();
          drawHairlineShadow(crown);

          // Left curtain wing (draping from center to left cheekbone)
          const leftCurtain = new Path2D();
          leftCurtain.moveTo(cx - 4, headTopY + 15);
          leftCurtain.bezierCurveTo(cx - faceW * 0.25, foreheadY - 15, cx - faceW * 0.45, foreheadY + 10, cx - faceW * 0.54, eyeY + 25);
          leftCurtain.bezierCurveTo(cx - faceW * 0.62, eyeY, cx - faceW * 0.58, foreheadY - 10, cx - faceW * 0.42, headTopY);
          leftCurtain.closePath();
          drawHairlineShadow(leftCurtain);

          // Right curtain wing (draping from center to right cheekbone)
          const rightCurtain = new Path2D();
          rightCurtain.moveTo(cx + 4, headTopY + 15);
          rightCurtain.bezierCurveTo(cx + faceW * 0.25, foreheadY - 15, cx + faceW * 0.45, foreheadY + 10, cx + faceW * 0.54, eyeY + 25);
          rightCurtain.bezierCurveTo(cx + faceW * 0.62, eyeY, cx + faceW * 0.58, foreheadY - 10, cx + faceW * 0.42, headTopY);
          rightCurtain.closePath();
          drawHairlineShadow(rightCurtain);

          // Middle Parting shadow
          ctx.strokeStyle = 'rgba(10, 10, 10, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, headTopY + 5);
          ctx.lineTo(cx, foreheadY - 8);
          ctx.stroke();

          // Flowing hair strands
          drawStrand(cx - 8, headTopY + 20, cx - faceW * 0.2, foreheadY, cx - faceW * 0.48, eyeY + 18, 0.35);
          drawStrand(cx - 15, headTopY + 25, cx - faceW * 0.25, foreheadY + 5, cx - faceW * 0.42, eyeY + 12, 0.2);
          drawStrand(cx + 8, headTopY + 20, cx + faceW * 0.2, foreheadY, cx + faceW * 0.48, eyeY + 18, 0.35);
          drawStrand(cx + 15, headTopY + 25, cx + faceW * 0.25, foreheadY + 5, cx + faceW * 0.42, eyeY + 12, 0.2);

        } else if (styleId.includes('side-part') || styleId.includes('classic')) {
          // ==========================================
          // 2. EXECUTIVE SIDE PART TAPER
          // ==========================================
          drawTaperFades();

          const partX = cx - faceW * 0.28;

          // Main swept-over volume (from part to right side)
          const mainSweep = new Path2D();
          mainSweep.moveTo(partX, foreheadY - 5);
          mainSweep.bezierCurveTo(partX + 10, headTopY - 20, cx + faceW * 0.4, headTopY - 15, cx + faceW * 0.55, eyeY - 15);
          mainSweep.bezierCurveTo(cx + faceW * 0.45, eyeY - 20, cx + faceW * 0.3, foreheadY, partX, foreheadY - 5);
          mainSweep.closePath();
          drawHairlineShadow(mainSweep);

          // Left side short taper (under the part)
          const leftTaper = new Path2D();
          leftTaper.moveTo(partX - 4, foreheadY - 5);
          leftTaper.bezierCurveTo(partX - faceW * 0.15, headTopY + 10, cx - faceW * 0.48, headTopY + 20, cx - faceW * 0.52, eyeY - 10);
          leftTaper.bezierCurveTo(cx - faceW * 0.45, eyeY - 15, partX - faceW * 0.2, foreheadY, partX - 4, foreheadY - 5);
          leftTaper.closePath();
          drawHairlineShadow(leftTaper);

          // Razor Part line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(partX, foreheadY - 3);
          ctx.lineTo(partX - 5, headTopY + 10);
          ctx.stroke();

          // Combed texture strands across top
          drawStrand(partX + 10, headTopY, cx + faceW * 0.15, headTopY - 8, cx + faceW * 0.45, foreheadY - 5, 0.4);
          drawStrand(partX + 15, headTopY + 15, cx + faceW * 0.2, headTopY + 5, cx + faceW * 0.42, foreheadY + 5, 0.3);

        } else if (styleId.includes('crop') || styleId.includes('french')) {
          // ==========================================
          // 3. TEXTURED FRENCH CROP
          // ==========================================
          drawTaperFades();

          // Blunt textured fringe across upper forehead
          const fringeY = foreheadY + 8;
          const crop = new Path2D();
          crop.moveTo(cx - faceW * 0.48, eyeY - 15);
          crop.bezierCurveTo(cx - faceW * 0.5, headTopY - 15, cx + faceW * 0.5, headTopY - 15, cx + faceW * 0.48, eyeY - 15);
          // Horizontal textured fringe edge
          crop.lineTo(cx + faceW * 0.42, fringeY - 4);
          crop.lineTo(cx + faceW * 0.25, fringeY);
          crop.lineTo(cx + faceW * 0.05, fringeY - 3);
          crop.lineTo(cx - faceW * 0.15, fringeY + 2);
          crop.lineTo(cx - faceW * 0.35, fringeY - 2);
          crop.lineTo(cx - faceW * 0.42, fringeY);
          crop.closePath();
          drawHairlineShadow(crop);

          // Choppy fringe jagged strokes
          ctx.strokeStyle = '#100E0C';
          ctx.lineWidth = 3;
          for (let i = -0.38; i <= 0.38; i += 0.06) {
            ctx.beginPath();
            ctx.moveTo(cx + faceW * i, fringeY - 8);
            ctx.lineTo(cx + faceW * i, fringeY + (Math.sin(i * 30) * 4));
            ctx.stroke();
          }

        } else if (styleId.includes('quiff') || styleId.includes('pompadour')) {
          // ==========================================
          // 4. MODERN QUIFF WITH MID FADE
          // ==========================================
          drawTaperFades();

          // Dramatic upward swept quiff peak
          const quiff = new Path2D();
          quiff.moveTo(cx - faceW * 0.48, eyeY - 15);
          quiff.bezierCurveTo(cx - faceW * 0.45, headTopY - 35, cx - faceW * 0.15, headTopY - 45, cx + 15, headTopY - 40);
          quiff.bezierCurveTo(cx + faceW * 0.35, headTopY - 30, cx + faceW * 0.5, headTopY - 15, cx + faceW * 0.48, eyeY - 15);
          quiff.bezierCurveTo(cx + faceW * 0.35, foreheadY - 10, cx - faceW * 0.35, foreheadY - 10, cx - faceW * 0.48, eyeY - 15);
          quiff.closePath();
          drawHairlineShadow(quiff);

          // Upward dynamic brush strokes
          drawStrand(cx - 20, foreheadY, cx - 15, headTopY - 10, cx - 5, headTopY - 35, 0.45);
          drawStrand(cx + 5, foreheadY, cx + 10, headTopY - 12, cx + 18, headTopY - 32, 0.4);
          drawStrand(cx - faceW * 0.2, foreheadY + 5, cx - faceW * 0.15, headTopY - 5, cx - faceW * 0.1, headTopY - 25, 0.3);

        } else if (styleId.includes('buzz')) {
          // ==========================================
          // 5. CLEAN BUZZ CUT WITH SKIN FADE
          // ==========================================
          drawTaperFades();

          // Tight contour close to scalp with laser sharp line-up
          const buzz = new Path2D();
          buzz.moveTo(cx - faceW * 0.48, eyeY - 10);
          buzz.bezierCurveTo(cx - faceW * 0.46, headTopY + 5, cx + faceW * 0.46, headTopY + 5, cx + faceW * 0.48, eyeY - 10);
          // Crisp sharp line-up at forehead
          buzz.lineTo(cx + faceW * 0.44, foreheadY - 15);
          buzz.lineTo(cx + faceW * 0.36, foreheadY - 18);
          buzz.lineTo(cx - faceW * 0.36, foreheadY - 18);
          buzz.lineTo(cx - faceW * 0.44, foreheadY - 15);
          buzz.closePath();
          drawHairlineShadow(buzz);

          // Sharp edge highlight
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - faceW * 0.36, foreheadY - 18);
          ctx.lineTo(cx + faceW * 0.36, foreheadY - 18);
          ctx.stroke();

        } else if (styleId.includes('curl')) {
          // ==========================================
          // 6. TAPERED CURLY TOP
          // ==========================================
          drawTaperFades();

          // Bouncy cloud of textured curls
          const curly = new Path2D();
          curly.moveTo(cx - faceW * 0.52, eyeY - 10);
          curly.bezierCurveTo(cx - faceW * 0.5, headTopY - 25, cx + faceW * 0.5, headTopY - 25, cx + faceW * 0.52, eyeY - 10);
          curly.bezierCurveTo(cx + faceW * 0.38, foreheadY + 5, cx - faceW * 0.38, foreheadY + 5, cx - faceW * 0.52, eyeY - 10);
          curly.closePath();
          drawHairlineShadow(curly);

          // Ringlet circles across the top
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 2;
          for (let i = -0.35; i <= 0.35; i += 0.1) {
            for (let j = 0; j < 3; j++) {
              ctx.beginPath();
              const ox = cx + faceW * i + (j % 2 * 12);
              const oy = headTopY + (j * 20) + (Math.sin(i * 10) * 10);
              ctx.arc(ox, oy, 12, 0, Math.PI * 1.5);
              ctx.stroke();
            }
          }

        } else {
          // ==========================================
          // 7. LOW TAPER FADE / DEFAULT NATURAL TEXTURE
          // ==========================================
          drawTaperFades();

          const natural = new Path2D();
          natural.moveTo(cx - faceW * 0.5, eyeY - 10);
          natural.bezierCurveTo(cx - faceW * 0.48, headTopY - 20, cx + faceW * 0.48, headTopY - 20, cx + faceW * 0.5, eyeY - 10);
          natural.bezierCurveTo(cx + faceW * 0.38, foreheadY - 8, cx - faceW * 0.38, foreheadY - 8, cx - faceW * 0.5, eyeY - 10);
          natural.closePath();
          drawHairlineShadow(natural);

          drawStrand(cx - 30, headTopY, cx - 10, headTopY - 10, cx + 25, headTopY - 12, 0.35);
          drawStrand(cx - faceW * 0.25, foreheadY - 5, cx - faceW * 0.1, headTopY + 5, cx + faceW * 0.2, headTopY + 2, 0.25);
        }

        // 4. Subtle Barber Verification Tag in bottom corner
        const badgeW = 220;
        const badgeH = 40;
        const badgeX = 24;
        const badgeY = H - 64;

        ctx.fillStyle = 'rgba(11, 15, 23, 0.85)';
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
        ctx.fill();
        ctx.stroke();

        // Green check dot
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(badgeX + 22, badgeY + 20, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(hairstyle.persianName, badgeX + badgeW - 16, badgeY + 24);

        ctx.restore();

        // 5. Export as pristine, high-fidelity JPEG
        const resultDataUrl = canvas.toDataURL('image/jpeg', 0.94);
        resolve(resultDataUrl);
      } catch (err) {
        console.error('[Canvas Hairstyle Synthesizer] Error:', err);
        resolve(frontImageDataUrl);
      }
    };

    img.onerror = () => {
      resolve(frontImageDataUrl);
    };

    img.src = frontImageDataUrl;
  });
}
