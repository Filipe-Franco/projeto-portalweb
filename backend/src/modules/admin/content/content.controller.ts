import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  createAdminContent,
  deleteAdminContent,
  getAdminContent,
  listAdminContent,
  updateAdminContent,
} from './content.service.js';

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

function requireContentKey(req: Request): string {
  const chave = req.params.chave;

  if (!chave) {
    throw new AppError('Chave não informada.', 422, 'INVALID_CONTENT_KEY');
  }

  return String(chave);
}

export const listAdminContentController = asyncHandler(async (req, res) => {
  const result = await listAdminContent(req.query);
  res.json(result);
});

export const getAdminContentController = asyncHandler(async (req, res) => {
  const result = await getAdminContent(requireContentKey(req));
  res.json(result);
});

export const createAdminContentController = asyncHandler(async (req, res) => {
  const result = await createAdminContent(req.body, requireAdminId(req), requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminContentController = asyncHandler(async (req, res) => {
  const result = await updateAdminContent(requireContentKey(req), req.body, requireAdminId(req), requestMeta(req));
  res.json(result);
});

export const deleteAdminContentController = asyncHandler(async (req, res) => {
  const result = await deleteAdminContent(requireContentKey(req), requireAdminId(req), requestMeta(req));
  res.json(result);
});
