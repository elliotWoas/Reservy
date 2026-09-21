import { CaptureAngle, FaceLandmarks, HeadPose } from '../types';

export function estimateHeadPose(landmarks: FaceLandmarks, targetAngle: CaptureAngle): HeadPose {
  const eyeSpan = Math.max(1, landmarks.rightEye.x - landmarks.leftEye.x);
  const noseRelativeX = (landmarks.noseTip.x - landmarks.leftEye.x) / eyeSpan;

  // Yaw calculation: 0.50 is centered. Offset scales to roughly [-70°, +70°]
  const rawYaw = (noseRelativeX - 0.5) * 120;
  const yaw = Math.round(Math.max(-75, Math.min(75, rawYaw)));

  // Pitch calculation: eye-to-nose vs nose-to-chin
  const eyeLevelY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const eyeToNose = Math.max(1, landmarks.noseTip.y - eyeLevelY);
  const noseToChin = Math.max(1, landmarks.chin.y - landmarks.noseTip.y);
  const pitchRatio = eyeToNose / noseToChin;
  const pitch = Math.round((pitchRatio - 0.85) * 60);

  // Roll calculation: eye line tilt
  const roll = Math.round(
    (Math.atan2(landmarks.rightEye.y - landmarks.leftEye.y, landmarks.rightEye.x - landmarks.leftEye.x) * 180) / Math.PI
  );

  let isValidForAngle = false;
  let angleStatus: 'valid' | 'invalid' | 'warning' = 'invalid';
  let feedback = '';

  if (targetAngle === 'front') {
    if (Math.abs(yaw) <= 16 && Math.abs(pitch) <= 22 && Math.abs(roll) <= 16) {
      isValidForAngle = true;
      angleStatus = 'valid';
      feedback = 'زاویه سر مستقیم و بسیار مناسب است.';
    } else if (Math.abs(yaw) <= 22 && Math.abs(pitch) <= 28) {
      isValidForAngle = true;
      angleStatus = 'warning';
      feedback = 'کمی سر خود را به مرکز بیاورید.';
    } else if (yaw < -22) {
      feedback = 'لطفاً مستقیم به دوربین نگاه کنید (سر به سمت چپ چرخیده است).';
    } else {
      feedback = 'لطفاً مستقیم به دوربین نگاه کنید (سر به سمت راست چرخیده است).';
    }
  } else if (targetAngle === 'left') {
    // Left profile: nose is shifted to the left (yaw negative)
    if (yaw <= -18 && yaw >= -65) {
      isValidForAngle = true;
      angleStatus = 'valid';
      feedback = 'زاویه نیم‌رخ چپ مناسب است.';
    } else if (yaw > -18 && yaw <= -10) {
      isValidForAngle = true;
      angleStatus = 'warning';
      feedback = 'کمی بیشتر سر خود را به چپ بچرخانید.';
    } else if (yaw > -10) {
      feedback = 'لطفاً سر خود را حدود ۳۰ تا ۴۵ درجه به سمت چپ بچرخانید.';
    } else {
      feedback = 'چرخش سر به سمت چپ بیش از حد است.';
    }
  } else if (targetAngle === 'right') {
    // Right profile: nose is shifted to the right (yaw positive)
    if (yaw >= 18 && yaw <= 65) {
      isValidForAngle = true;
      angleStatus = 'valid';
      feedback = 'زاویه نیم‌رخ راست مناسب است.';
    } else if (yaw < 18 && yaw >= 10) {
      isValidForAngle = true;
      angleStatus = 'warning';
      feedback = 'کمی بیشتر سر خود را به راست بچرخانید.';
    } else if (yaw < 10) {
      feedback = 'لطفاً سر خود را حدود ۳۰ تا ۴۵ درجه به سمت راست بچرخانید.';
    } else {
      feedback = 'چرخش سر به سمت راست بیش از حد است.';
    }
  }

  return {
    yaw,
    pitch,
    roll,
    isValidForAngle,
    angleStatus,
    feedback,
  };
}
