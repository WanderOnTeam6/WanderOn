import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the BASE URL as is, since it's used by other pages
export const BASE = 'http://localhost:4000'.replace(/\/$/, '');

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();  // Use the updated async getToken function

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

// Updated token helpers using AsyncStorage
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