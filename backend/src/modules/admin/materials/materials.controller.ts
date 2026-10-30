import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { createAdminMaterial, deleteAdminMaterial, getAdminMaterial, getAdminMaterialDownload, listAdminMaterials, updateAdminMaterial, uploadAdminMaterialFile } from './materials.service.js';

function requireAdminId(req: Request): string {
  if (!req.authUser || req.authUser.role !== 'admin') throw new AppError('Autenticação administrativa obrigatória.', 401, 'AUTH_REQUIRED');
  return req.authUser.id;
}
function requestMeta(req: Request) { return { ip: req.ip, userAgent: req.get('user-agent') || null }; }
function requireId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || !id.trim()) throw new AppError('Material não informado.', 422, 'INVALID_MATERIAL_ID');
  return id;
}
export const listAdminMaterialsController = asyncHandler(async (req, res) => { res.json(await listAdminMaterials(req.query)); });
export const getAdminMaterialController = asyncHandler(async (req, res) => { res.json(await getAdminMaterial(requireId(req))); });
export const uploadAdminMaterialFileController = asyncHandler(async (req, res) => { requireAdminId(req); res.status(201).json(await uploadAdminMaterialFile(req.body)); });
export const downloadAdminMaterialController = asyncHandler(async (req, res) => { requireAdminId(req); const file = await getAdminMaterialDownload(requireId(req)); res.download(file.filePath, file.fileName); });
export const createAdminMaterialController = asyncHandler(async (req, res) => { const result = await createAdminMaterial(req.body, requireAdminId(req), requestMeta(req)); res.status(201).json(result); });
export const updateAdminMaterialController = asyncHandler(async (req, res) => { res.json(await updateAdminMaterial(requireId(req), req.body, requireAdminId(req), requestMeta(req))); });
export const deleteAdminMaterialController = asyncHandler(async (req, res) => { res.json(await deleteAdminMaterial(requireId(req), requireAdminId(req), requestMeta(req))); });
