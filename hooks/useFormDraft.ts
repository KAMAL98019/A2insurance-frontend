import { useCallback } from 'react';

export function useFormDraft<T extends object>(key: string) {
  const save = useCallback(
    (values: T) => {
      try { localStorage.setItem(key, JSON.stringify(values)); } catch {}
    },
    [key],
  );

  const load = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
  }, [key]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch {}
  }, [key]);

  const exists = useCallback((): boolean => {
    try { return !!localStorage.getItem(key); } catch { return false; }
  }, [key]);

  return { save, load, clear, exists };
}
