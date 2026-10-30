import type { Request } from 'express';
import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  approveAdminVolunteer,
  createManualAdminVolunteer,
  deleteAdminVolunteer,
  getAdminVolunteer,
  listAdminVolunteers,
  reactivateAdminVolunteer,
  rejectAdminVolunteer,
  suspendAdminVolunteer,
  updateManualAdminVolunteer,
} from './volunteers.service.js';

function requireAdminId(req: Request): string {
  if (!req.authUser || req.authUser.role !== 'admin') {
    throw new AppError('Autenticação administrativa obrigatória.', 401, 'AUTH_REQUIRED');
  }

  return req.authUser.id;
}

function requestMeta(req: Request) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent') || null,
  };
}

function requireVolunteerId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError('Voluntário não informado.', 422, 'INVALID_VOLUNTEER_ID');
  }

  return id;
}

export const listAdminVolunteersController = asyncHandler(async (req, res) => {
  const result = await listAdminVolunteers(req.query);
  res.json(result);
});

export const getAdminVolunteerController = asyncHandler(async (req, res) => {
  const volunteer = await getAdminVolunteer(requireVolunteerId(req));
  res.json(volunteer);
});

export const createAdminVolunteerController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await createManualAdminVolunteer(req.body, adminId, requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminVolunteerController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await updateManualAdminVolunteer(requireVolunteerId(req), req.body, adminId, requestMeta(req));
  res.json(result);
});

export const approveAdminVolunteerController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await approveAdminVolunteer(requireVolunteerId(req), adminId, requestMeta(req));
  res.json(result);
});

export const rejectAdminVolunteerController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await rejectAdminVolunteer(requireVolunteerId(req), adminId, req.body, requestMeta(req));
  res.json(result);
});

export const suspendAdminVolunteerController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await suspendAdminVolunteer(requireVolunteerId(req), adminId, req.body, requestMeta(req));
  res.json(result);
});


export const reactivateAdminVolunteerController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await reactivateAdminVolunteer(requireVolunteerId(req), adminId, requestMeta(req));
  res.json(result);
});

export const deleteAdminVolunteerController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await deleteAdminVolunteer(requireVolunteerId(req), adminId, requestMeta(req));
  res.json(result);
});
