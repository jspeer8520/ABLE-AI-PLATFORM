import { apiRequest, type AuthUser, type AuthTokens } from '@/app/lib/api';

interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

interface RegisterResponse {
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: { email, password, name },
  });
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  return apiRequest<AuthTokens>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

export async function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  });
}
