import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  createAdminGallery,
  deleteAdminGallery,
  getAdminGallery,
  listAdminGallery,
  updateAdminGallery,
  uploadAdminGalleryImage,
} from './gallery.service.js';

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

function requireGalleryId(req: Request): string {
  const id = req.params.id;

  if (!id) {
    throw new AppError('Imagem não informada.', 422, 'INVALID_GALLERY_ID');
  }

  return String(id);
}

export const listAdminGalleryController = asyncHandler(async (req, res) => {
  const result = await listAdminGallery(req.query);
  res.json(result);
});

export const getAdminGalleryController = asyncHandler(async (req, res) => {
  const result = await getAdminGallery(requireGalleryId(req));
  res.json(result);
});

export const uploadAdminGalleryImageController = asyncHandler(async (req, res) => {
  requireAdminId(req);
  const baseUrl = req.protocol + '://' + req.get('host');
  const result = await uploadAdminGalleryImage(req.body, baseUrl);
  res.status(201).json(result);
});

export const createAdminGalleryController = asyncHandler(async (req, res) => {
  const result = await createAdminGallery(req.body, requireAdminId(req), requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminGalleryController = asyncHandler(async (req, res) => {
  const result = await updateAdminGallery(requireGalleryId(req), req.body, requireAdminId(req), requestMeta(req));
  res.json(result);
});

export const deleteAdminGalleryController = asyncHandler(async (req, res) => {
  const result = await deleteAdminGallery(requireGalleryId(req), requireAdminId(req), requestMeta(req));
  res.json(result);
});
