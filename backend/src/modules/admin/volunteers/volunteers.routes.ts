import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import {
  approveAdminVolunteerController,
  createAdminVolunteerController,
  deleteAdminVolunteerController,
  getAdminVolunteerController,
  listAdminVolunteersController,
  reactivateAdminVolunteerController,
  rejectAdminVolunteerController,
  suspendAdminVolunteerController,
  updateAdminVolunteerController,
} from './volunteers.controller.js';

export const adminVolunteersRouter = Router();

const adminOnly = [requireAuth, requireRole('admin')] as const;

adminVolunteersRouter.get('/admin/voluntarios', ...adminOnly, listAdminVolunteersController);
adminVolunteersRouter.post('/admin/voluntarios', ...adminOnly, createAdminVolunteerController);
adminVolunteersRouter.get('/admin/voluntarios/:id', ...adminOnly, getAdminVolunteerController);
adminVolunteersRouter.patch('/admin/voluntarios/:id', ...adminOnly, updateAdminVolunteerController);
adminVolunteersRouter.patch('/admin/voluntarios/:id/aprovar', ...adminOnly, approveAdminVolunteerController);
adminVolunteersRouter.patch('/admin/voluntarios/:id/rejeitar', ...adminOnly, rejectAdminVolunteerController);
adminVolunteersRouter.patch('/admin/voluntarios/:id/suspender', ...adminOnly, suspendAdminVolunteerController);
adminVolunteersRouter.patch('/admin/voluntarios/:id/reativar', ...adminOnly, reactivateAdminVolunteerController);
adminVolunteersRouter.delete('/admin/voluntarios/:id', ...adminOnly, deleteAdminVolunteerController);
