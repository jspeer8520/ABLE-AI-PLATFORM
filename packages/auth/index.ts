export * from './clerk'
export * from './middleware'

export interface AuthContext {
  userId: string | null
  organizationId: string | null
  role: 'owner' | 'member' | 'admin' | null
  isAuthenticated: boolean
}

export const AUTH_ERRORS = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
} as const
