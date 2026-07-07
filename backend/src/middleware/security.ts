import helmet from 'helmet';

/**
 * Baseline HTTP hardening. This service is an API (no HTML rendering), so the
 * default CSP is disabled to avoid interfering with JSON clients; all other
 * Helmet protections (HSTS, no-sniff, frameguard, etc.) remain enabled.
 */
export const securityMiddleware = helmet({
  contentSecurityPolicy: false,
});
