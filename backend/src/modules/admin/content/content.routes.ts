import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import {
  createAdminContentController,
  deleteAdminContentController,
  getAdminContentController,
  listAdminContentController,
  updateAdminContentController,
} from './content.controller.js';

export const adminContentRouter = Router();

const adminOnly = [requireAuth, requireRole('admin')] as const;

adminContentRouter.get('/admin/conteudo', ...adminOnly, listAdminContentController);
adminContentRouter.post('/admin/conteudo', ...adminOnly, createAdminContentController);
adminContentRouter.get('/admin/conteudo/:chave', ...adminOnly, getAdminContentController);
adminContentRouter.patch('/admin/conteudo/:chave', ...adminOnly, updateAdminContentController);
adminContentRouter.delete('/admin/conteudo/:chave', ...adminOnly, deleteAdminContentController);
