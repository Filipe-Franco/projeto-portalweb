import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { createAdminAnnouncement, deleteAdminAnnouncement, getAdminAnnouncement, listAdminAnnouncementReadings, listAdminAnnouncements, updateAdminAnnouncement } from './announcements.service.js';

function requireAdminId(req: Request): string {
  if (!req.authUser || req.authUser.role !== 'admin') throw new AppError('Autenticação administrativa obrigatória.', 401, 'AUTH_REQUIRED');
  return req.authUser.id;
}
function requestMeta(req: Request) { return { ip: req.ip, userAgent: req.get('user-agent') || null }; }
function requireId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || !id.trim()) throw new AppError('Comunicado não informado.', 422, 'INVALID_ANNOUNCEMENT_ID');
  return id;
}

export const listAdminAnnouncementsController = asyncHandler(async (req, res) => { res.json(await listAdminAnnouncements(req.query)); });
export const getAdminAnnouncementController = asyncHandler(async (req, res) => { res.json(await getAdminAnnouncement(requireId(req))); });
export const createAdminAnnouncementController = asyncHandler(async (req, res) => { const result = await createAdminAnnouncement(req.body, requireAdminId(req), requestMeta(req)); res.status(201).json(result); });
export const updateAdminAnnouncementController = asyncHandler(async (req, res) => { res.json(await updateAdminAnnouncement(requireId(req), req.body, requireAdminId(req), requestMeta(req))); });
export const deleteAdminAnnouncementController = asyncHandler(async (req, res) => { res.json(await deleteAdminAnnouncement(requireId(req), requireAdminId(req), requestMeta(req))); });
export const listAdminAnnouncementReadingsController = asyncHandler(async (req, res) => { res.json(await listAdminAnnouncementReadings(requireId(req))); });
