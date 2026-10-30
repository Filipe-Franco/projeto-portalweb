import type { ErrorRequestHandler } from 'express';

import { isProduction } from '../config/env.js';
import { logger } from '../config/logger.js';

type HttpError = Error & {
  status?: number;
  statusCode?: number;
  code?: string;
};

export const errorHandler: ErrorRequestHandler = (error: HttpError, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number(error.statusCode || error.status || 500);

  if (statusCode >= 500) {
    logger.error('request_failed', {
      error,
      code: error.code,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
      userId: req.authUser?.id || null,
      role: req.authUser?.role || null,
    });
  }

  return res.status(statusCode).json({
    error: {
      message: statusCode >= 500 ? 'Erro interno do servidor.' : error.message,
      ...(error.code ? { code: error.code } : {}),
      ...(isProduction ? {} : { details: error.message }),
    },
  });
};
