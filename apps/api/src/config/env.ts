import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

function findEnvPath(startDir: string): string | undefined {
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, '.env');
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

dotenv.config({ path: findEnvPath(process.cwd()) });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-reservy-default-key-32',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH || './uploads',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mock',
};
