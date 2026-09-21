import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../.env');

// Zero-dependency loader for monorepo root .env
if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || '';
const basePath = rawBasePath
  ? (rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`).replace(/\/+$/, '')
  : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: basePath,
  transpilePackages: ['@reservy/domain', '@reservy/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'wallart.cafe' },
    ],
  },
};

export default nextConfig;
