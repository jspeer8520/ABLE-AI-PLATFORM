import { useAuth } from './useAuth';
import { useCallback } from 'react';

interface FetchOptions extends RequestInit {
  baseURL?: string;
  timeout?: number;
}

type APIRequest = <T = any>(url: string, options?: FetchOptions) => Promise<T>;

export const useAPI = (): { request: APIRequest } => {
  const { user } = useAuth();

  const request = useCallback(
    async <T = any>(
      url: string,
      options: FetchOptions = {}
    ): Promise<T> => {
      const {
        baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000',
        timeout = 10000,
        headers: customHeaders = {},
        ...fetchOptions
      } = options;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Normalize headers to a plain object so we can set Authorization safely
        const headersObj: Record<string, string> = {
          'Content-Type': 'application/json',
          ...((customHeaders as Record<string, string>) || {}),
        };

        if (user?.accessToken) {
          headersObj['Authorization'] = `Bearer ${user.accessToken}`;
        }

        const response = await fetch(`${baseURL}${url}`, {
          ...fetchOptions,
          headers: headersObj,
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error?.message || response.statusText);
        }

        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [user?.accessToken]
  );

  return { request };
};
