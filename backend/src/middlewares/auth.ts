import type { RequestHandler } from 'express';

import { AppError } from '../utils/AppError.js';
import { verifyAuthToken } from '../modules/auth/auth.service.js';
import type { AuthUser } from '../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Token de autenticação não informado.', 401, 'MISSING_TOKEN');
    }

    req.authUser = await verifyAuthToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
