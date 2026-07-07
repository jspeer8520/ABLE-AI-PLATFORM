import pino, { type LoggerOptions } from 'pino';

/**
 * Structured application logger.
 *
 * This is the single logging entry point for the backend — `console.*` is not
 * used anywhere in the service. Sensitive request fields are redacted so tokens
 * and credentials never reach the log sink.
 *
 * The level is read directly from `process.env` (not the parsed `env` module)
 * to avoid a circular import: `env` uses this logger to report configuration
 * errors.
 */
const options: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'able-backend',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.refreshToken',
      // The single-use email-verification token travels in the query string
      // (GET /api/auth/verify?token=...). Redact the query and the full URL so
      // it can never be reconstructed from a log line.
      'req.query.token',
      'req.query',
      'req.url',
    ],
    censor: '[redacted]',
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
};

export const logger = pino(options);

export type Logger = typeof logger;
