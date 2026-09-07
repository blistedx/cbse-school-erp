/*! Giterp Multi-School Enterprise ERP Core v1.2.1 */
/**
 * apiFetch: drop-in client-side replacement for fetch()
 * Automatically attaches the signed session token from localStorage as an Authorization: Bearer header.
 * Automatically recovers session token via /api/auth/session if missing or on 401 Unauthorized.
 */

let refreshPromise: Promise<string | null> | null = null;

async function requestFreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const rawUser = localStorage.getItem('current_user');
    const rawSchool = localStorage.getItem('current_school');
    if (!rawUser) return null;

    const u = JSON.parse(rawUser);
    const s = rawSchool ? JSON.parse(rawSchool) : null;
    const schoolId = u.school_id || s?.school_code || s?.id || 'DPS2026';
    const role = u.role || 'ADMIN';
    const userId = u.id || u.username || 'admin';

    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, schoolId, role, username: u.username })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.session_token) {
        localStorage.setItem('erp_session_token', data.session_token);
        return data.session_token;
      }
    }
  } catch (e) {
    console.warn('[apiFetch] Token auto-recovery error:', e);
  }
  return null;
}

export async function getSessionToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('erp_session_token') || '';
  if (token) return token;

  if (!refreshPromise) {
    refreshPromise = requestFreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return (await refreshPromise) || '';
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window === 'undefined') return fetch(url, options);

  let token = await getSessionToken();

  const makeRequest = (authToken: string) => {
    const headers = new Headers(options.headers || {});
    if (authToken) {
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }
      if (!headers.has('x-session-token')) {
        headers.set('x-session-token', authToken);
      }
    }
    return fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers
    });
  };

  let response = await makeRequest(token);

  // If 401 Unauthorized (token expired or invalidated), attempt auto-refresh once
  if (response.status === 401 && !url.includes('/api/auth/')) {
    localStorage.removeItem('erp_session_token');
    const newToken = await requestFreshToken();
    if (newToken) {
      response = await makeRequest(newToken);
    }
  }

  return response;
}

export default apiFetch;
