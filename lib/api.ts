import AsyncStorage from '@react-native-async-storage/async-storage';

const CODESPACES_BASE = 'https://bug-free-telegram-x7476944r7rhvqwj-4000.app.github.dev'.replace(/\/$/, '');
const LOCAL_BASE = 'http://localhost:4000'.replace(/\/$/, '');

function detectBase() {
  let base: string;

  if (typeof window !== 'undefined' && window.location.hostname.includes('app.github.dev')) {
    base = CODESPACES_BASE;
    console.log(
      '%c[API DETECTED]',
      'color: #4ade80; font-weight: bold;',
      'Running in GitHub Codespaces environment.'
    );
  } else {
    base = LOCAL_BASE;
    console.log(
      '%c[API DETECTED]',
      'color: #60a5fa; font-weight: bold;',
      'Running in local environment.'
    );
  }

  console.log('%c[API BASE]', 'color: #facc15; font-weight: bold;', base);
  return base;
}

export const BASE = detectBase();

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, { ...options, headers, credentials: 'omit' });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data as any)?.error || (data as any)?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

// Token helpers
export async function setToken(token: string) {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (e) {
    console.error('Error setting token:', e);
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem('token');
  } catch (e) {
    console.error('Error getting token:', e);
    return null;
  }
}

export async function clearToken() {
  try {
    await AsyncStorage.removeItem('token');
  } catch (e) {
    console.error('Error clearing token:', e);
  }
}
