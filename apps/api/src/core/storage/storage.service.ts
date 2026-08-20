import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DomainError, DomainErrorCode } from '@reservy/domain';
import { ENV } from '../../config/env';

export interface StoredFileResult {
  fileUrl: string;
  mimeType: string;
  size: number;
  originalName: string;
}

export interface IStorageService {
  saveFile(buffer: Buffer, originalName: string, declaredMimeType: string): Promise<StoredFileResult>;
  deleteFile(fileUrl: string): Promise<void>;
}

// Magic bytes validator for secure file verification
export function validateFileMimeType(buffer: Buffer, declaredMime: string): string {
  const hex = buffer.toString('hex', 0, 4);

  let verifiedMime = '';
  if (hex.startsWith('ffd8ff')) {
    verifiedMime = 'image/jpeg';
  } else if (hex.startsWith('89504e47')) {
    verifiedMime = 'image/png';
  } else if (buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WEBP') {
    verifiedMime = 'image/webp';
  } else if (buffer.toString('utf8', 0, 4) === '%PDF') {
    verifiedMime = 'application/pdf';
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!verifiedMime || !allowedMimes.includes(verifiedMime)) {
    throw new DomainError(
      DomainErrorCode.INVALID_FILE_TYPE,
      'فایل ارسالی نامعتبر است. تنها فرمت‌های JPG، PNG، WEBP و PDF مجاز می‌باشند.'
    );
  }

  return verifiedMime;
}

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), ENV.LOCAL_STORAGE_PATH);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalName: string, declaredMimeType: string): Promise<StoredFileResult> {
    const verifiedMime = validateFileMimeType(buffer, declaredMimeType);
    const extension = verifiedMime === 'application/pdf' ? 'pdf' : verifiedMime.split('/')[1];
    const safeRandomFilename = `${crypto.randomUUID()}.${extension}`;
    const destinationPath = path.join(this.uploadDir, safeRandomFilename);

    await fs.promises.writeFile(destinationPath, buffer);

    return {
      fileUrl: `/uploads/${safeRandomFilename}`,
      mimeType: verifiedMime,
      size: buffer.length,
      originalName,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const filename = path.basename(fileUrl);
    const targetPath = path.join(this.uploadDir, filename);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  }
}

export const storageService: IStorageService = new LocalStorageService();
