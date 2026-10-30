import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { listVolunteerAnnouncements, markVolunteerAnnouncementRead } from './announcements.service.js';

function requireVolunteerId(req: Request): string {
  if (!req.authUser || req.authUser.role !== 'voluntario') throw new AppError('Autenticação de voluntário obrigatória.', 401, 'AUTH_REQUIRED');
  return req.authUser.id;
}
function requireId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || !id.trim()) throw new AppError('Comunicado não informado.', 422, 'INVALID_ANNOUNCEMENT_ID');
  return id;
}
export const listVolunteerAnnouncementsController = asyncHandler(async (req, res) => { res.json(await listVolunteerAnnouncements(requireVolunteerId(req))); });
export const markVolunteerAnnouncementReadController = asyncHandler(async (req, res) => { res.json(await markVolunteerAnnouncementRead(requireId(req), requireVolunteerId(req))); });
