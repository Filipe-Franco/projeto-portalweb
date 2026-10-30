import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/requireRole.js';
import {
  changeAdminPasswordController,
  changePortalPasswordController,
  getAdminProfileController,
  getAdminProfilePhotoController,
  getPortalProfileController,
  getPortalProfilePhotoController,
  updateAdminProfileController,
  updatePortalProfileController,
  uploadAdminProfilePhotoController,
  uploadPortalProfilePhotoController,
} from './profile.controller.js';

export const profileRouter = Router();
const adminOnly = [requireAuth, requireRole('admin')] as const;
const volunteerOnly = [requireAuth, requireRole('voluntario')] as const;
const profileLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

profileRouter.get('/admin/perfil', ...adminOnly, getAdminProfileController);
profileRouter.patch('/admin/perfil', ...adminOnly, updateAdminProfileController);
profileRouter.patch('/admin/perfil/senha', profileLimiter, ...adminOnly, changeAdminPasswordController);
profileRouter.post('/admin/perfil/foto', profileLimiter, ...adminOnly, uploadAdminProfilePhotoController);
profileRouter.get('/admin/perfil/foto', ...adminOnly, getAdminProfilePhotoController);

profileRouter.get('/portal/perfil', ...volunteerOnly, getPortalProfileController);
profileRouter.patch('/portal/perfil', ...volunteerOnly, updatePortalProfileController);
profileRouter.patch('/portal/perfil/senha', profileLimiter, ...volunteerOnly, changePortalPasswordController);
profileRouter.post('/portal/perfil/foto', profileLimiter, ...volunteerOnly, uploadPortalProfilePhotoController);
profileRouter.get('/portal/perfil/foto', ...volunteerOnly, getPortalProfilePhotoController);
