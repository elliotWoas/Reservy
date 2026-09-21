/**
 * Application Runtime Configuration
 *
 * Centralizes environment variables for API and Web URLs.
 * Supports both standalone domain deployment and subpath deployment (e.g. /reservy)
 * without requiring any code changes.
 */

export const APP_CONFIG = {
  // API URL: Points to the backend endpoint (e.g. 'http://localhost:4002' or 'https://wallart.cafe/reservy-api')
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002').replace(/\/+$/, ''),

  // App URL: Full public domain URL (e.g. 'http://localhost:3002' or 'https://wallart.cafe/reservy')
  appBaseUrl: (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3002'
  ).replace(/\/+$/, ''),

  // Subpath prefix if mounted under a subpath (e.g. '/reservy', or empty string for root/standalone)
  basePath: (process.env.NEXT_PUBLIC_BASE_PATH || '').trim().replace(/\/+$/, ''),
};

/**
 * Resolves a full API URL given a relative endpoint path.
 */
export function resolveApiUrl(path: string): string {
  if (!path) return APP_CONFIG.apiBaseUrl;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_CONFIG.apiBaseUrl}${cleanPath}`;
}

/**
 * Resolves static or uploaded asset URLs (e.g. payment receipt images).
 */
export function resolveAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_CONFIG.apiBaseUrl}${cleanPath}`;
}

/**
 * Resolves public frontend routes (e.g. shareable booking links).
 */
export function resolveAppUrl(path: string): string {
  if (!path) return APP_CONFIG.appBaseUrl;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_CONFIG.appBaseUrl}${cleanPath}`;
}
