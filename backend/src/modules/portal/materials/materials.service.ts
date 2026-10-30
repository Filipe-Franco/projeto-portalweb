import path from 'node:path';

import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { findPublishedMaterialById, listPublishedMaterials } from './materials.repository.js';

export async function listVolunteerMaterials() {
  return { data: await listPublishedMaterials() };
}

function resolveMaterialUploadPath(arquivoUrl: string) {
  const fileName = path.basename(String(arquivoUrl || ''));
  if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(fileName)) throw new AppError('Arquivo inválido.', 404, 'MATERIAL_FILE_NOT_FOUND');
  const folder = path.resolve(env.uploadDir, 'materials');
  const filePath = path.resolve(folder, fileName);
  if (!filePath.startsWith(folder + path.sep)) throw new AppError('Arquivo inválido.', 404, 'MATERIAL_FILE_NOT_FOUND');
  return { filePath, fileName };
}

export async function getVolunteerMaterialDownload(id: string) {
  const item = await findPublishedMaterialById(id);
  if (!item) throw new AppError('Material não encontrado.', 404, 'MATERIAL_NOT_FOUND');
  if (!item.arquivo_url || !item.arquivo_url.startsWith('/uploads/materials/')) throw new AppError('Este material não possui arquivo interno.', 404, 'MATERIAL_FILE_NOT_FOUND');
  return resolveMaterialUploadPath(item.arquivo_url);
}
