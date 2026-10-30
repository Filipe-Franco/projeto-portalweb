import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  createVolunteerController,
  listContentController,
  listDonationLocationsController,
  listFaqController,
  listGalleryController,
  listInterestAreasController,
  listPublicDonationsController,
  listPublicEventsController,
  listPortalCoordinationController,
  listTeamMembersController,
} from './public.controller.js';

export const publicRouter = Router();
const volunteerApplicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Muitas tentativas de cadastro. Tente novamente mais tarde.',
      code: 'RATE_LIMITED',
    },
  },
});

publicRouter.get('/conteudo', listContentController);
publicRouter.get('/equipe', listTeamMembersController);
publicRouter.get('/equipe/coordenacao', listPortalCoordinationController);
publicRouter.get('/eventos', listPublicEventsController);
publicRouter.get('/areas-interesse', listInterestAreasController);
publicRouter.post('/voluntarios', volunteerApplicationLimiter, createVolunteerController);
publicRouter.get('/faq', listFaqController);
publicRouter.get('/doacoes/publico', listPublicDonationsController);
publicRouter.get('/locais-doacao', listDonationLocationsController);
publicRouter.get('/galeria', listGalleryController);
