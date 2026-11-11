const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const rawAiServiceUrl = (import.meta.env.VITE_AI_SERVICE_URL || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = rawApiBaseUrl;
export const AI_SERVICE_URL = rawAiServiceUrl;

/**
 * Resolves relative API routes against VITE_API_BASE_URL when configured,
 * preserving relative paths for local Vite dev proxy or same-origin Vercel rewrites.
 */
export function buildApiUrl(path) {
  if (!path || typeof path !== 'string') return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}

/**
 * Resolves AI prediction routes. When VITE_AI_SERVICE_URL is configured, large
 * multipart radiograph uploads can target the hosted Python AI service directly
 * (avoiding Vercel Serverless 4.5 MB body limits) using Bearer JWT auth.
 */
export function buildAiUrl(path) {
  if (!path || typeof path !== 'string') return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!AI_SERVICE_URL) {
    return buildApiUrl(normalized);
  }
  // When VITE_AI_SERVICE_URL=/ai in the unified Vercel deployment, avoid duplicating /api/ai
  if (
    (AI_SERVICE_URL === '/ai' || AI_SERVICE_URL.endsWith('/ai')) &&
    (normalized === '/api/ai' || normalized.startsWith('/api/ai/'))
  ) {
    return `${AI_SERVICE_URL}${normalized.slice('/api/ai'.length)}`;
  }
  return `${AI_SERVICE_URL}${normalized}`;
}
