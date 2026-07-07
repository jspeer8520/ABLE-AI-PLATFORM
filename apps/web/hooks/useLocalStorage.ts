import { useCallback } from 'react';

export const useLocalStorage = () => {
  const setItem = useCallback((key: string, value: string, ttl?: number) => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? ttl * 1000 : null, // Convert seconds to ms
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (err) {
      console.error('LocalStorage setItem error:', err);
    }
  }, []);

  const getItem = useCallback((key: string): string | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item) as {
        value: string;
        timestamp: number;
        ttl: number | null;
      };

      // Check if expired
      if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (err) {
      console.error('LocalStorage getItem error:', err);
      return null;
    }
  }, []);

  const removeItem = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('LocalStorage removeItem error:', err);
    }
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.clear();
    } catch (err) {
      console.error('LocalStorage clear error:', err);
    }
  }, []);

  return { setItem, getItem, removeItem, clear };
};
