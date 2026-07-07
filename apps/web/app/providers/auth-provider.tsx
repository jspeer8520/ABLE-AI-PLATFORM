'use client';

/**
 * Client-side authentication context for the ABLE web app.
 *
 * Session model:
 * - The access token is short-lived and kept ONLY in memory (a ref) so it never
 *   touches persistent storage.
 * - The refresh token is persisted in `localStorage` so the session survives a
 *   page reload. Trade-off: localStorage is readable by any script running on
 *   the page, so a successful XSS attack could exfiltrate the refresh token.
 *   The backend mitigates the blast radius with refresh-token rotation and
 *   server-side revocation, but the safest alternative (an httpOnly cookie set
 *   by the backend) is not available with this API contract. Keep the app free
 *   of untrusted third-party scripts.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import { ApiError, apiRequest, type AuthTokens, type AuthUser } from '@/lib/api';

const REFRESH_TOKEN_STORAGE_KEY = 'able.refreshToken';

function readRefreshToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

function writeRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  }
}

function removeRefreshToken(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

export interface AuthContextValue {
  /** The authenticated user, or `null` when signed out. */
  user: AuthUser | null;
  /** `false` until the initial session hydration completes. */
  isLoaded: boolean;
  /** Convenience flag: a user is present. */
  isSignedIn: boolean;
  /** Authenticates with email/password and loads the user. */
  login: (email: string, password: string) => Promise<void>;
  /** Registers a new account. Does not sign in (email must be verified first). */
  register: (email: string, password: string, name?: string) => Promise<AuthUser>;
  /** Revokes the refresh token, clears local state and returns to `/login`. */
  logout: () => Promise<void>;
  /**
   * Authenticated fetch wrapper. Attaches the current access token and, on a
   * 401, transparently refreshes once and retries. If refresh fails the session
   * is cleared and the user is redirected to `/login`.
   */
  authFetch: <T>(
    path: string,
    options?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown },
  ) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Access token lives only in memory. A ref (not state) keeps callbacks stable
  // and always reads the freshest token without triggering re-renders.
  const accessTokenRef = useRef<string | null>(null);

  const clearAuth = useCallback(() => {
    accessTokenRef.current = null;
    removeRefreshToken();
    setUser(null);
  }, []);

  const storeTokens = useCallback((tokens: AuthTokens) => {
    accessTokenRef.current = tokens.accessToken;
    writeRefreshToken(tokens.refreshToken);
  }, []);

  const fetchMe = useCallback(async (): Promise<AuthUser> => {
    const { user: me } = await apiRequest<{ user: AuthUser }>('/api/auth/me', {
      token: accessTokenRef.current,
    });
    return me;
  }, []);

  /**
   * Exchanges the stored refresh token for a fresh token pair (rotation) and
   * returns the new access token. Throws if no refresh token exists or the
   * backend rejects it.
   */
  const refreshSession = useCallback(async (): Promise<string> => {
    const refreshToken = readRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No active session');
    }
    const tokens = await apiRequest<AuthTokens>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    storeTokens(tokens);
    return tokens.accessToken;
  }, [storeTokens]);

  const authFetch = useCallback(
    async <T,>(
      path: string,
      options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {},
    ): Promise<T> => {
      try {
        return await apiRequest<T>(path, { ...options, token: accessTokenRef.current });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }
        // Access token expired: refresh once and retry.
        let newToken: string;
        try {
          newToken = await refreshSession();
        } catch {
          clearAuth();
          router.replace('/login');
          throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in.');
        }
        return apiRequest<T>(path, { ...options, token: newToken });
      }
    },
    [refreshSession, clearAuth, router],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const tokens = await apiRequest<AuthTokens>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      storeTokens(tokens);
      const me = await fetchMe();
      setUser(me);
    },
    [storeTokens, fetchMe],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<AuthUser> => {
      const { user: created } = await apiRequest<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, ...(name ? { name } : {}) },
      });
      return created;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = readRefreshToken();
    if (refreshToken) {
      // Best-effort revocation; the backend treats logout as idempotent.
      try {
        await apiRequest('/api/auth/logout', { method: 'POST', body: { refreshToken } });
      } catch {
        // Ignore — we clear local state regardless.
      }
    }
    clearAuth();
    router.replace('/login');
  }, [clearAuth, router]);

  // Hydrate the session on first load: if a refresh token survives, rotate it
  // and load the current user. Any failure ends in a clean signed-out state.
  useEffect(() => {
    let cancelled = false;

    async function hydrate(): Promise<void> {
      if (!readRefreshToken()) {
        if (!cancelled) setIsLoaded(true);
        return;
      }
      try {
        await refreshSession();
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [refreshSession, fetchMe, clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoaded,
      isSignedIn: user !== null,
      login,
      register,
      logout,
      authFetch,
    }),
    [user, isLoaded, login, register, logout, authFetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context. Must be used within an {@link AuthProvider}. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
