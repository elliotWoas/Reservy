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
