import { asyncHandler } from '../../../utils/asyncHandler.js';
import { getAdminDashboard } from './dashboard.service.js';

export const getAdminDashboardController = asyncHandler(async (_req, res) => {
  res.json(await getAdminDashboard());
});
