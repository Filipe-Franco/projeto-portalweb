import { asyncHandler } from '../../../utils/asyncHandler.js';
import { getVolunteerMaterialDownload, listVolunteerMaterials } from './materials.service.js';

export const listVolunteerMaterialsController = asyncHandler(async (_req, res) => {
  res.json(await listVolunteerMaterials());
});

export const downloadVolunteerMaterialController = asyncHandler(async (req, res) => {
  const id = String(req.params.id || '');
  const file = await getVolunteerMaterialDownload(id);
  res.download(file.filePath, file.fileName);
});
