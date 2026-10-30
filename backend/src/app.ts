import cors from 'cors';
import express from 'express';
import path from 'node:path';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { adminAnnouncementsRouter } from './modules/admin/announcements/announcements.routes.js';
import { adminContentRouter } from './modules/admin/content/content.routes.js';
import { adminDashboardRouter } from './modules/admin/dashboard/dashboard.routes.js';
import { adminGalleryRouter } from './modules/admin/gallery/gallery.routes.js';
import { adminMaterialsRouter } from './modules/admin/materials/materials.routes.js';
import { adminLogsRouter } from './modules/admin/logs/logs.routes.js';
import { adminTeamRouter } from './modules/admin/team/team.routes.js';
import { adminUploadsRouter } from './modules/admin/uploads/uploads.routes.js';
import { adminDonationsRouter } from './modules/admin/donations/donations.routes.js';
import { adminEventsRouter } from './modules/admin/events/events.routes.js';
import { adminEmailRouter } from './modules/email/email.routes.js';
import { adminFaqRouter } from './modules/admin/faq/faq.routes.js';
import { adminVolunteersRouter } from './modules/admin/volunteers/volunteers.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { portalAnnouncementsRouter } from './modules/portal/announcements/announcements.routes.js';
import { portalEventsRouter } from './modules/portal/events/events.routes.js';
import { portalMaterialsRouter } from './modules/portal/materials/materials.routes.js';
import { portalUploadsRouter } from './modules/portal/uploads/uploads.routes.js';
import { publicRouter } from './modules/public/public.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';

export function createApp() {
  const app = express();
  const uploadJsonLimit = Math.ceil(env.maxUploadMb * 1.5) + 'mb';

  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use('/api/admin/galeria/upload', express.json({ limit: uploadJsonLimit }));
  app.use('/api/admin/materiais/upload', express.json({ limit: uploadJsonLimit }));
  app.use('/api/portal/uploads', express.json({ limit: uploadJsonLimit }));
  app.use('/api/admin/perfil/foto', express.json({ limit: uploadJsonLimit }));
  app.use('/api/portal/perfil/foto', express.json({ limit: uploadJsonLimit }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/uploads/gallery', express.static(path.resolve(env.uploadDir, 'gallery'), {
    fallthrough: false,
    index: false,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }));

  app.use('/api/health', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', adminDashboardRouter);
  app.use('/api', adminVolunteersRouter);
  app.use('/api', adminFaqRouter);
  app.use('/api', adminDonationsRouter);
  app.use('/api', adminTeamRouter);
  app.use('/api', adminContentRouter);
  app.use('/api', adminGalleryRouter);
  app.use('/api', adminEventsRouter);
  app.use('/api', adminAnnouncementsRouter);
  app.use('/api', adminMaterialsRouter);
  app.use('/api', adminUploadsRouter);
  app.use('/api', adminLogsRouter);
  app.use('/api', adminEmailRouter);
  app.use('/api', profileRouter);
  app.use('/api', portalEventsRouter);
  app.use('/api', portalAnnouncementsRouter);
  app.use('/api', portalMaterialsRouter);
  app.use('/api', portalUploadsRouter);
  app.use('/api', publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
