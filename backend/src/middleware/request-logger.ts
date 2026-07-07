import pinoHttp from 'pino-http';

import { logger } from '../services/logging/logger';

/**
 * Per-request structured logging. Attaches a child logger to `req.log`, assigns
 * a request id, and logs completion with method, path, status, and latency.
 */
export const requestLogger = pinoHttp({
  logger,
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
});
