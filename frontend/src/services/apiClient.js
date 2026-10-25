// MediMind Platform - Centralized Authenticated API Client
// Enforces valid JWT attachment, token expiration checks, and controlled redirect on 401 Unauthorized.

export const TOKEN_STORAGE_KEY = 'medimind_jwt_token';
export const SESSION_STORAGE_KEY = 'medimind_auth_session';

/**
 * Validates whether a JWT token is expired using base64 payload decoding.
 * Adds a 5-second buffer to prevent edge-of-expiry network race conditions.
 */
export function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= payload.exp - 5;
  } catch {
    return true;
  }
}

/**
 * Retrieves the active, valid JWT token from localStorage or session.
 * Automatically clears expired tokens and dispatches an unauthorized event.
 */
export function getStoredToken() {
  if (typeof window === 'undefined') return null;

  let token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '{}');
      if (session?.token) {
        token = session.token;
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (token && isTokenExpired(token)) {
    handleUnauthorized('Your authentication session has expired. Please sign in again.');
    return null;
  }

  return token || null;
}

/**
 * Handles 401 Unauthorized responses or expired tokens:
 * Clears stored credentials and broadcasts an auth event to gracefully redirect to /login.
 */
let isRedirecting = false;
export function handleUnauthorized(message = 'Session expired or unauthorized. Please sign in.') {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
  try {
    sessionStorage.clear();
  } catch {}

  if (!isRedirecting) {
    isRedirecting = true;
    window.dispatchEvent(
      new CustomEvent('medimind:unauthorized', {
        detail: { message },
      })
    );
    setTimeout(() => {
      isRedirecting = false;
    }, 1500);
  }
}

/**
 * Constructs standard headers including Content-Type and Authorization Bearer token.
 */
export function getAuthHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Robust fetch wrapper that automatically:
 * 1. Injects valid Authorization Bearer header
 * 2. Pre-checks token validity to prevent unnecessary 401 roundtrips
 * 3. Catches HTTP 401 responses and dispatches controlled redirect event
 */
export async function authFetch(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    handleUnauthorized('Session expired or unauthorized access. Please sign in again.');
  }

  return response;
}
