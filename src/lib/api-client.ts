/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * apiFetch: drop-in client-side replacement for fetch()
 * Automatically attaches the signed session token from localStorage as an Authorization: Bearer header.
 */
export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window === 'undefined') return fetch(url, options);
  const token = localStorage.getItem('erp_session_token') || '';
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

export default apiFetch;
