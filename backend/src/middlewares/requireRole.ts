import type { RequestHandler } from 'express';

import { AppError } from '../utils/AppError.js';
import type { AuthRole } from '../modules/auth/auth.types.js';

export function requireRole(...roles: AuthRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.authUser) {
      return next(new AppError('Autenticação obrigatória.', 401, 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.authUser.role)) {
      return next(new AppError('Você não tem permissão para acessar este recurso.', 403, 'FORBIDDEN'));
    }

    return next();
  };
}
