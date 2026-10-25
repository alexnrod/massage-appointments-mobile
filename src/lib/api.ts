import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://xn--80aaahbqf6ald0daf5a8cwh.xn--p1ai';
const TOKEN_KEY = 'admin_token';

let token = SecureStore.getItem(TOKEN_KEY);
const listeners = new Set<() => void>();

function setToken(next: string | null) {
  token = next;
  if (next) SecureStore.setItem(TOKEN_KEY, next);
  else SecureStore.deleteItemAsync(TOKEN_KEY);
  listeners.forEach((l) => l());
}

export function useIsLoggedIn() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => token !== null,
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'Нет соединения с сервером');
  }
  // Expired or revoked token (ADMIN_JWT_SECRET rotated): back to the login screen.
  if (res.status === 401 && token) setToken(null);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Ошибка сервера (${res.status})`);
  return data as T;
}

export async function login(password: string) {
  try {
    const data = await api<{ token?: string }>('/api/admin/auth', { method: 'POST', body: { password, mobile: true } });
    // A backend without mobile login answers 200 without a token.
    if (!data?.token) throw new ApiError(500, 'Сервер не поддерживает вход из приложения. Обновите сайт.');
    setToken(data.token);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw new ApiError(401, 'Неверный пароль');
    if (e instanceof ApiError && e.status === 429) throw new ApiError(429, 'Слишком много попыток. Попробуйте через час.');
    throw e;
  }
}

export function logout() {
  setToken(null);
}
