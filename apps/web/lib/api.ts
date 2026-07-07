/**
 * Low-level HTTP client for the ABLE JWT backend (Express, base path `/api`).
 *
 * This module is intentionally auth-agnostic: it knows how to talk to the API
 * and how to translate the backend's JSON error envelope into a typed
 * {@link ApiError}, but it does NOT own the session. Token storage, refresh and
 * retry live in the auth provider so React state stays the single source of
 * truth. See `app/providers/auth-provider.tsx`.
 */

/** Base URL of the backend API. Configurable per environment. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Public user shape returned by the backend (`PublicUser`). */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}

/** Token pair returned by `/login`, `/refresh`. Mirrors `IssuedTokens`. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

/** Backend error envelope produced by the central error middleware. */
interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Error thrown for any non-2xx API response. Carries the HTTP status and the
 * backend error `code`/`message` so callers can branch on them (e.g. 403 for an
 * unverified account, 401 for expired tokens).
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorBody).error === 'object'
  );
}

/**
 * Performs a JSON request against the backend and returns the parsed body.
 *
 * - Serializes `body` as JSON and sets the appropriate headers.
 * - Attaches a Bearer token when `token` is provided.
 * - Throws {@link ApiError} on any non-2xx response, reading the backend's JSON
 *   error message when available and falling back to a generic message when the
 *   server is unreachable or returns a non-JSON body.
 */
export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string | null;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    // Network-level failure (server down, DNS, CORS preflight, aborted).
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause;
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Please try again.');
  }

  // 204 / empty body.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }

  if (!response.ok) {
    if (isErrorBody(parsed)) {
      throw new ApiError(
        response.status,
        parsed.error.code,
        parsed.error.message,
        parsed.error.details,
      );
    }
    throw new ApiError(
      response.status,
      'HTTP_ERROR',
      `Request failed with status ${response.status}`,
    );
  }

  return parsed as T;
}
