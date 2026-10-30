import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaq,
  listAdminFaq,
  updateAdminFaq,
} from './faq.service.js';

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

function requireFaqId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError('Pergunta frequente não informada.', 422, 'INVALID_FAQ_ID');
  }

  return id;
}

export const listAdminFaqController = asyncHandler(async (req, res) => {
  const result = await listAdminFaq(req.query);
  res.json(result);
});

export const getAdminFaqController = asyncHandler(async (req, res) => {
  const result = await getAdminFaq(requireFaqId(req));
  res.json(result);
});

export const createAdminFaqController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await createAdminFaq(req.body, adminId, requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminFaqController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await updateAdminFaq(requireFaqId(req), req.body, adminId, requestMeta(req));
  res.json(result);
});

export const deleteAdminFaqController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await deleteAdminFaq(requireFaqId(req), adminId, requestMeta(req));
  res.json(result);
});
