// If type declarations for 'react' are not available in the environment,
// ignore the missing-module error for this import so the hook can still be used.
// @ts-ignore: Could not find module 'react' or its corresponding type declarations.
import { useState, useCallback, useEffect } from 'react';
import { useAPI } from './useAPI';

export interface User {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const useAuth = () => {
  const { request } = useAPI();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        // Check if token expired
        if (parsed.expiresAt > Date.now()) {
          setUser(parsed);
        } else {
          localStorage.removeItem('user');
        }
      } catch (err) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await request<any>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        });

        // Don't auto-login, user must verify email first
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await request<User>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        setUser(response);
        localStorage.setItem('user', JSON.stringify(response));
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [request]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const refreshToken = useCallback(async () => {
    if (!user?.refreshToken) return;

    try {
      const response = await request<User>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: user.refreshToken }),
      });

      setUser(response);
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (err) {
      logout();
      throw err;
    }
  }, [user?.refreshToken, request, logout]);

  return {
    user,
    isLoading,
    error,
    register,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
  };
};
