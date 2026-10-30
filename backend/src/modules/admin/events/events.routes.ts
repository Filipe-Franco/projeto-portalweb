import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import { createAdminEventController, deleteAdminEventController, getAdminEventController, listAdminEventAttendancesController, listAdminEventsController, updateAdminEventController } from './events.controller.js';

export const adminEventsRouter = Router();
const adminOnly = [requireAuth, requireRole('admin')] as const;

adminEventsRouter.get('/admin/eventos', ...adminOnly, listAdminEventsController);
adminEventsRouter.post('/admin/eventos', ...adminOnly, createAdminEventController);
adminEventsRouter.get('/admin/eventos/:id', ...adminOnly, getAdminEventController);
adminEventsRouter.patch('/admin/eventos/:id', ...adminOnly, updateAdminEventController);
adminEventsRouter.delete('/admin/eventos/:id', ...adminOnly, deleteAdminEventController);
adminEventsRouter.get('/admin/eventos/:id/presencas', ...adminOnly, listAdminEventAttendancesController);
