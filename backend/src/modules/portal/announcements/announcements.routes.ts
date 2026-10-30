import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import { listVolunteerAnnouncementsController, markVolunteerAnnouncementReadController } from './announcements.controller.js';

export const portalAnnouncementsRouter = Router();
const volunteerOnly = [requireAuth, requireRole('voluntario')] as const;

portalAnnouncementsRouter.get('/portal/comunicados', ...volunteerOnly, listVolunteerAnnouncementsController);
portalAnnouncementsRouter.patch('/portal/comunicados/:id/lido', ...volunteerOnly, markVolunteerAnnouncementReadController);
