import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import {
  createAdminGalleryController,
  deleteAdminGalleryController,
  getAdminGalleryController,
  listAdminGalleryController,
  updateAdminGalleryController,
  uploadAdminGalleryImageController,
} from './gallery.controller.js';

export const adminGalleryRouter = Router();

const adminOnly = [requireAuth, requireRole('admin')] as const;

adminGalleryRouter.get('/admin/galeria', ...adminOnly, listAdminGalleryController);
adminGalleryRouter.post('/admin/galeria/upload', ...adminOnly, uploadAdminGalleryImageController);
adminGalleryRouter.post('/admin/galeria', ...adminOnly, createAdminGalleryController);
adminGalleryRouter.get('/admin/galeria/:id', ...adminOnly, getAdminGalleryController);
adminGalleryRouter.patch('/admin/galeria/:id', ...adminOnly, updateAdminGalleryController);
adminGalleryRouter.delete('/admin/galeria/:id', ...adminOnly, deleteAdminGalleryController);
