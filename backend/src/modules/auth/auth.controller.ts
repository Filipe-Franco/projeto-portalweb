import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  activateVolunteer,
  loginAdmin,
  loginVolunteer,
  requestPasswordReset,
  resetPassword,
} from './auth.service.js';

export const loginAdminController = asyncHandler(async (req, res) => {
  const result = await loginAdmin(req.body);
  res.json(result);
});

export const loginVolunteerController = asyncHandler(async (req, res) => {
  const result = await loginVolunteer(req.body);
  res.json(result);
});

export const forgotAdminPasswordController = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset('admin', req.body);
  res.json(result);
});

export const forgotVolunteerPasswordController = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset('voluntario', req.body);
  res.json(result);
});

export const resetAdminPasswordController = asyncHandler(async (req, res) => {
  const result = await resetPassword('admin', req.body);
  res.json(result);
});

export const resetVolunteerPasswordController = asyncHandler(async (req, res) => {
  const result = await resetPassword('voluntario', req.body);
  res.json(result);
});

export const activateVolunteerController = asyncHandler(async (req, res) => {
  const result = await activateVolunteer(req.body);
  res.json(result);
});
