// lib/api.ts

// Your Codespaces API base (strip trailing slash just in case)
const BASE = 'https://bug-free-telegram-x7476944r7rhvqwj-4000.app.github.dev'.replace(/\/$/, '');

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Ensure exactly one slash between BASE and path
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, { ...options, headers, credentials: 'omit' });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data as any)?.error || (data as any)?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

// Simple token helpers (web-only)
export function setToken(token: string) {
  localStorage.setItem('token', token);
}
export function getToken() {
  return localStorage.getItem('token');
}
export function clearToken() {
  localStorage.removeItem('token');
}
