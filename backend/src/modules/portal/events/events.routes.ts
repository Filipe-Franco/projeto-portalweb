import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import { listVolunteerEventsController, setVolunteerPresenceController } from './events.controller.js';

export const portalEventsRouter = Router();
const volunteerOnly = [requireAuth, requireRole('voluntario')] as const;

portalEventsRouter.get('/portal/eventos', ...volunteerOnly, listVolunteerEventsController);
portalEventsRouter.patch('/portal/eventos/:id/presenca', ...volunteerOnly, setVolunteerPresenceController);
