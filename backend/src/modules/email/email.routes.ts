import { Router } from 'express';

import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { processEmailQueue } from './email.service.js';

export const adminEmailRouter = Router();
const adminOnly = [requireAuth, requireRole('admin')] as const;

adminEmailRouter.post('/admin/email/processar-fila', ...adminOnly, asyncHandler(async (_req, res) => {
  const result = await processEmailQueue();
  res.json({ data: result, message: result.skipped ? 'SMTP não configurado.' : 'Fila de e-mail processada.' });
}));
