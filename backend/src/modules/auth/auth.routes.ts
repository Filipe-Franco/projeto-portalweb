import { Router } from 'express';

import { authRateLimiter } from '../../middlewares/rateLimit.js';
import {
  activateVolunteerController,
  forgotAdminPasswordController,
  forgotVolunteerPasswordController,
  loginAdminController,
  loginVolunteerController,
  resetAdminPasswordController,
  resetVolunteerPasswordController,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/admin/auth/login', authRateLimiter, loginAdminController);
authRouter.post('/admin/auth/esqueci-senha', authRateLimiter, forgotAdminPasswordController);
authRouter.post('/admin/auth/redefinir-senha', authRateLimiter, resetAdminPasswordController);

authRouter.post('/portal/auth/login', authRateLimiter, loginVolunteerController);
authRouter.post('/portal/auth/esqueci-senha', authRateLimiter, forgotVolunteerPasswordController);
authRouter.post('/portal/auth/redefinir-senha', authRateLimiter, resetVolunteerPasswordController);
authRouter.post('/portal/auth/ativar-conta', authRateLimiter, activateVolunteerController);
