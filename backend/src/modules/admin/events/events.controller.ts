import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { createAdminEvent, deleteAdminEvent, getAdminEvent, listAdminEventAttendances, listAdminEvents, updateAdminEvent } from './events.service.js';

function requireAdminId(req: Request): string {
  if (!req.authUser || req.authUser.role !== 'admin') throw new AppError('Autenticação administrativa obrigatória.', 401, 'AUTH_REQUIRED');
  return req.authUser.id;
}

function requestMeta(req: Request) {
  return { ip: req.ip, userAgent: req.get('user-agent') || null };
}

function requireId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || !id.trim()) throw new AppError('Evento não informado.', 422, 'INVALID_EVENT_ID');
  return id;
}

export const listAdminEventsController = asyncHandler(async (req, res) => {
  res.json(await listAdminEvents(req.query));
});

export const getAdminEventController = asyncHandler(async (req, res) => {
  res.json(await getAdminEvent(requireId(req)));
});

export const createAdminEventController = asyncHandler(async (req, res) => {
  const result = await createAdminEvent(req.body, requireAdminId(req), requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminEventController = asyncHandler(async (req, res) => {
  res.json(await updateAdminEvent(requireId(req), req.body, requireAdminId(req), requestMeta(req)));
});

export const deleteAdminEventController = asyncHandler(async (req, res) => {
  res.json(await deleteAdminEvent(requireId(req), requireAdminId(req), requestMeta(req)));
});

export const listAdminEventAttendancesController = asyncHandler(async (req, res) => {
  res.json(await listAdminEventAttendances(requireId(req)));
});
