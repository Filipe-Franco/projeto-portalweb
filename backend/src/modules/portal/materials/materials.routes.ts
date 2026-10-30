import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import { downloadVolunteerMaterialController, listVolunteerMaterialsController } from './materials.controller.js';

export const portalMaterialsRouter = Router();
const volunteerOnly = [requireAuth, requireRole('voluntario')] as const;

portalMaterialsRouter.get('/portal/materiais', ...volunteerOnly, listVolunteerMaterialsController);
portalMaterialsRouter.get('/portal/materiais/:id/download', ...volunteerOnly, downloadVolunteerMaterialController);
