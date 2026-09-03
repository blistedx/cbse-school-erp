/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * apiFetch: drop-in client-side replacement for fetch()
 * Automatically attaches the signed session token from localStorage as an Authorization: Bearer header.
 */
export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window === 'undefined') return fetch(url, options);

  let token = localStorage.getItem('erp_session_token') || '';

  // Fallback: Check document.cookie if not in localStorage
  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)erp_session_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]).trim();
      if (token) {
        localStorage.setItem('erp_session_token', token);
      }
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('x-session-token')) {
      headers.set('x-session-token', token);
    }
  }

  return fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers
  });
}

export default apiFetch;
