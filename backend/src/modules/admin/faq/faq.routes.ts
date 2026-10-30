import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import {
  createAdminFaqController,
  deleteAdminFaqController,
  getAdminFaqController,
  listAdminFaqController,
  updateAdminFaqController,
} from './faq.controller.js';

export const adminFaqRouter = Router();

const adminOnly = [requireAuth, requireRole('admin')] as const;

adminFaqRouter.get('/admin/faq', ...adminOnly, listAdminFaqController);
adminFaqRouter.post('/admin/faq', ...adminOnly, createAdminFaqController);
adminFaqRouter.get('/admin/faq/:id', ...adminOnly, getAdminFaqController);
adminFaqRouter.patch('/admin/faq/:id', ...adminOnly, updateAdminFaqController);
adminFaqRouter.delete('/admin/faq/:id', ...adminOnly, deleteAdminFaqController);
