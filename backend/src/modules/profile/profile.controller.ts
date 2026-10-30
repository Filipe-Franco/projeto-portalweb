import type { Request, Response } from 'express';

import { AppError } from '../../utils/AppError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AuthRole } from '../auth/auth.types.js';
import { changeCurrentPassword, getCurrentProfilePhoto, getProfile, updateCurrentProfile, uploadCurrentProfilePhoto } from './profile.service.js';

function requireUser(req: Request, role: AuthRole) {
  if (!req.authUser?.id || req.authUser.role !== role) {
    throw new AppError('Usuário autenticado não encontrado.', 401, 'AUTH_REQUIRED');
  }
  return req.authUser.id;
}

function meta(req: Request) {
  return { ip: req.ip, userAgent: req.get('user-agent') || null };
}

function sendPhoto(res: Response, filePath: string, fileName: string) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath, { headers: { 'Content-Disposition': 'inline; filename="' + fileName + '"' } });
}

export const getAdminProfileController = asyncHandler(async (req, res) => {
  res.json(await getProfile('admin', requireUser(req, 'admin')));
});

export const updateAdminProfileController = asyncHandler(async (req, res) => {
  res.json(await updateCurrentProfile('admin', requireUser(req, 'admin'), req.body, meta(req)));
});

export const changeAdminPasswordController = asyncHandler(async (req, res) => {
  res.json(await changeCurrentPassword('admin', requireUser(req, 'admin'), req.body, meta(req)));
});

export const uploadAdminProfilePhotoController = asyncHandler(async (req, res) => {
  res.json(await uploadCurrentProfilePhoto('admin', requireUser(req, 'admin'), req.body, meta(req)));
});

export const getAdminProfilePhotoController = asyncHandler(async (req, res) => {
  const photo = await getCurrentProfilePhoto('admin', requireUser(req, 'admin'));
  sendPhoto(res, photo.filePath, photo.fileName);
});

export const getPortalProfileController = asyncHandler(async (req, res) => {
  res.json(await getProfile('voluntario', requireUser(req, 'voluntario')));
});

export const updatePortalProfileController = asyncHandler(async (req, res) => {
  res.json(await updateCurrentProfile('voluntario', requireUser(req, 'voluntario'), req.body, meta(req)));
});

export const changePortalPasswordController = asyncHandler(async (req, res) => {
  res.json(await changeCurrentPassword('voluntario', requireUser(req, 'voluntario'), req.body, meta(req)));
});

export const uploadPortalProfilePhotoController = asyncHandler(async (req, res) => {
  res.json(await uploadCurrentProfilePhoto('voluntario', requireUser(req, 'voluntario'), req.body, meta(req)));
});

export const getPortalProfilePhotoController = asyncHandler(async (req, res) => {
  const photo = await getCurrentProfilePhoto('voluntario', requireUser(req, 'voluntario'));
  sendPhoto(res, photo.filePath, photo.fileName);
});
