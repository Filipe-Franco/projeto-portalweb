import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import { getAdminDashboardController } from './dashboard.controller.js';

export const adminDashboardRouter = Router();
adminDashboardRouter.get('/admin/dashboard', requireAuth, requireRole('admin'), getAdminDashboardController);
