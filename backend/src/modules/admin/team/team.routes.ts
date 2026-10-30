import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import {
  createAdminTeamController,
  deleteAdminTeamController,
  getAdminTeamController,
  listAdminTeamController,
  updateAdminTeamController,
} from './team.controller.js';

export const adminTeamRouter = Router();

const adminOnly = [requireAuth, requireRole('admin')] as const;

adminTeamRouter.get('/admin/equipe', ...adminOnly, listAdminTeamController);
adminTeamRouter.post('/admin/equipe', ...adminOnly, createAdminTeamController);
adminTeamRouter.get('/admin/equipe/:id', ...adminOnly, getAdminTeamController);
adminTeamRouter.patch('/admin/equipe/:id', ...adminOnly, updateAdminTeamController);
adminTeamRouter.delete('/admin/equipe/:id', ...adminOnly, deleteAdminTeamController);
