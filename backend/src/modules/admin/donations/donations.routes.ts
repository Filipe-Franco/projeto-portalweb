import { Router } from 'express';

import { requireAuth } from '../../../middlewares/auth.js';
import { requireRole } from '../../../middlewares/requireRole.js';
import {
  createAdminDonationController,
  createAdminDonationLocationController,
  deleteAdminDonationController,
  deleteAdminDonationLocationController,
  getAdminDonationController,
  getAdminDonationLocationController,
  getAdminDonationSummaryController,
  listAdminDonationLocationsController,
  listAdminDonationsController,
  updateAdminDonationController,
  updateAdminDonationLocationController,
} from './donations.controller.js';

export const adminDonationsRouter = Router();

const adminOnly = [requireAuth, requireRole('admin')] as const;

adminDonationsRouter.get('/admin/doacoes', ...adminOnly, listAdminDonationsController);
adminDonationsRouter.get('/admin/doacoes/resumo', ...adminOnly, getAdminDonationSummaryController);
adminDonationsRouter.post('/admin/doacoes', ...adminOnly, createAdminDonationController);
adminDonationsRouter.get('/admin/doacoes/:id', ...adminOnly, getAdminDonationController);
adminDonationsRouter.patch('/admin/doacoes/:id', ...adminOnly, updateAdminDonationController);
adminDonationsRouter.delete('/admin/doacoes/:id', ...adminOnly, deleteAdminDonationController);

adminDonationsRouter.get('/admin/locais-doacao', ...adminOnly, listAdminDonationLocationsController);
adminDonationsRouter.post('/admin/locais-doacao', ...adminOnly, createAdminDonationLocationController);
adminDonationsRouter.get('/admin/locais-doacao/:id', ...adminOnly, getAdminDonationLocationController);
adminDonationsRouter.patch('/admin/locais-doacao/:id', ...adminOnly, updateAdminDonationLocationController);
adminDonationsRouter.delete('/admin/locais-doacao/:id', ...adminOnly, deleteAdminDonationLocationController);
