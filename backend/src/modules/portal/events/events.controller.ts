import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { listVolunteerEvents, setVolunteerPresence } from './events.service.js';

function requireVolunteerId(req: Request): string {
  if (!req.authUser || req.authUser.role !== 'voluntario') throw new AppError('Autenticação de voluntário obrigatória.', 401, 'AUTH_REQUIRED');
  return req.authUser.id;
}
function requireId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || !id.trim()) throw new AppError('Evento não informado.', 422, 'INVALID_EVENT_ID');
  return id;
}
export const listVolunteerEventsController = asyncHandler(async (req, res) => { res.json(await listVolunteerEvents(requireVolunteerId(req))); });
export const setVolunteerPresenceController = asyncHandler(async (req, res) => { res.json(await setVolunteerPresence(requireId(req), requireVolunteerId(req), req.body)); });
