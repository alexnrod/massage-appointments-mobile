import { useFocusEffect } from 'expo-router';
import Storage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useState } from 'react';

import { api } from './api';

const refreshers = new Set<() => void>();

/** Re-fetches every mounted query: after a change, a push, or the app coming back to the foreground. */
export function refreshAll() {
  refreshers.forEach((r) => r());
}

/** GET with the last response kept on the device, so the app still shows data offline. */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | undefined>(() => {
    const cached = Storage.getItemSync(path);
    return cached ? (JSON.parse(cached) as T) : undefined;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await api<T>(path);
      Storage.setItemSync(path, JSON.stringify(fresh));
      setData(fresh);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    refreshers.add(refresh);
    return () => {
      refreshers.delete(refresh);
    };
  }, [refresh]);

  return { data, error, loading, refresh };
}

/** Runs a change against the API, then refreshes all screens. Throws the API's message on failure. */
export async function mutate(path: string, method: string, body?: unknown) {
  await api(path, { method, body });
  refreshAll();
}
