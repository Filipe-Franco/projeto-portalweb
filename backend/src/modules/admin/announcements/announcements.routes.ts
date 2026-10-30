import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import { createAdminAnnouncementController, deleteAdminAnnouncementController, getAdminAnnouncementController, listAdminAnnouncementReadingsController, listAdminAnnouncementsController, updateAdminAnnouncementController } from './announcements.controller.js';

export const adminAnnouncementsRouter = Router();
const adminOnly = [requireAuth, requireRole('admin')] as const;

adminAnnouncementsRouter.get('/admin/comunicados', ...adminOnly, listAdminAnnouncementsController);
adminAnnouncementsRouter.post('/admin/comunicados', ...adminOnly, createAdminAnnouncementController);
adminAnnouncementsRouter.get('/admin/comunicados/:id', ...adminOnly, getAdminAnnouncementController);
adminAnnouncementsRouter.patch('/admin/comunicados/:id', ...adminOnly, updateAdminAnnouncementController);
adminAnnouncementsRouter.delete('/admin/comunicados/:id', ...adminOnly, deleteAdminAnnouncementController);
adminAnnouncementsRouter.get('/admin/comunicados/:id/leituras', ...adminOnly, listAdminAnnouncementReadingsController);
