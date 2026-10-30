import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  createAdminTeam,
  deleteAdminTeam,
  getAdminTeam,
  listAdminTeam,
  updateAdminTeam,
} from './team.service.js';

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

function requireTeamMemberId(req: Request): string {
  const id = req.params.id;

  if (!id) {
    throw new AppError('Membro da equipe não informado.', 422, 'INVALID_TEAM_MEMBER_ID');
  }

  return String(id);
}

export const listAdminTeamController = asyncHandler(async (req, res) => {
  const result = await listAdminTeam(req.query);
  res.json(result);
});

export const getAdminTeamController = asyncHandler(async (req, res) => {
  const result = await getAdminTeam(requireTeamMemberId(req));
  res.json(result);
});

export const createAdminTeamController = asyncHandler(async (req, res) => {
  const result = await createAdminTeam(req.body, requireAdminId(req), requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminTeamController = asyncHandler(async (req, res) => {
  const result = await updateAdminTeam(requireTeamMemberId(req), req.body, requireAdminId(req), requestMeta(req));
  res.json(result);
});

export const deleteAdminTeamController = asyncHandler(async (req, res) => {
  const result = await deleteAdminTeam(requireTeamMemberId(req), requireAdminId(req), requestMeta(req));
  res.json(result);
});
