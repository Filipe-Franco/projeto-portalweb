import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import { createAdminMaterialController, deleteAdminMaterialController, downloadAdminMaterialController, getAdminMaterialController, listAdminMaterialsController, updateAdminMaterialController, uploadAdminMaterialFileController } from './materials.controller.js';

export const adminMaterialsRouter = Router();
const adminOnly = [requireAuth, requireRole('admin')] as const;

adminMaterialsRouter.get('/admin/materiais', ...adminOnly, listAdminMaterialsController);
adminMaterialsRouter.post('/admin/materiais', ...adminOnly, createAdminMaterialController);
adminMaterialsRouter.post('/admin/materiais/upload', ...adminOnly, uploadAdminMaterialFileController);
adminMaterialsRouter.get('/admin/materiais/:id', ...adminOnly, getAdminMaterialController);
adminMaterialsRouter.get('/admin/materiais/:id/download', ...adminOnly, downloadAdminMaterialController);
adminMaterialsRouter.patch('/admin/materiais/:id', ...adminOnly, updateAdminMaterialController);
adminMaterialsRouter.delete('/admin/materiais/:id', ...adminOnly, deleteAdminMaterialController);
