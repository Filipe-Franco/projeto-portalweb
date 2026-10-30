import type { Request } from 'express';

import { AppError } from '../../../utils/AppError.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  createAdminDonation,
  createAdminDonationLocation,
  deleteAdminDonation,
  deleteAdminDonationLocation,
  getAdminDonation,
  getAdminDonationLocation,
  getAdminDonationSummary,
  listAdminDonationLocations,
  listAdminDonations,
  updateAdminDonation,
  updateAdminDonationLocation,
} from './donations.service.js';

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

function requireId(req: Request, message: string, code: string): string {
  const id = req.params.id;

  if (typeof id !== 'string' || !id.trim()) {
    throw new AppError(message, 422, code);
  }

  return id;
}

export const listAdminDonationsController = asyncHandler(async (req, res) => {
  const result = await listAdminDonations(req.query);
  res.json(result);
});

export const getAdminDonationSummaryController = asyncHandler(async (_req, res) => {
  const result = await getAdminDonationSummary();
  res.json(result);
});

export const getAdminDonationController = asyncHandler(async (req, res) => {
  const result = await getAdminDonation(requireId(req, 'Doação não informada.', 'INVALID_DONATION_ID'));
  res.json(result);
});

export const createAdminDonationController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await createAdminDonation(req.body, adminId, requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminDonationController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await updateAdminDonation(requireId(req, 'Doação não informada.', 'INVALID_DONATION_ID'), req.body, adminId, requestMeta(req));
  res.json(result);
});

export const deleteAdminDonationController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await deleteAdminDonation(requireId(req, 'Doação não informada.', 'INVALID_DONATION_ID'), adminId, requestMeta(req));
  res.json(result);
});

export const listAdminDonationLocationsController = asyncHandler(async (req, res) => {
  const result = await listAdminDonationLocations(req.query);
  res.json(result);
});

export const getAdminDonationLocationController = asyncHandler(async (req, res) => {
  const result = await getAdminDonationLocation(requireId(req, 'Local de doação não informado.', 'INVALID_DONATION_LOCATION_ID'));
  res.json(result);
});

export const createAdminDonationLocationController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await createAdminDonationLocation(req.body, adminId, requestMeta(req));
  res.status(201).json(result);
});

export const updateAdminDonationLocationController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await updateAdminDonationLocation(requireId(req, 'Local de doação não informado.', 'INVALID_DONATION_LOCATION_ID'), req.body, adminId, requestMeta(req));
  res.json(result);
});

export const deleteAdminDonationLocationController = asyncHandler(async (req, res) => {
  const adminId = requireAdminId(req);
  const result = await deleteAdminDonationLocation(requireId(req, 'Local de doação não informado.', 'INVALID_DONATION_LOCATION_ID'), adminId, requestMeta(req));
  res.json(result);
});
