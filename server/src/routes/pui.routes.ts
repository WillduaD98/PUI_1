import { Router } from 'express';
import { rateLimitByKey } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { puiLogin } from '../controllers/puiAuthController.js';
import { activarReporte, activarReportePrueba, desactivarReporte } from '../controllers/puiReportController.js';

export const puiRouter = Router();

puiRouter.post(
  '/login',
  rateLimitByKey({ windowMs: 60000, max: 15 }),
  puiLogin
);

puiRouter.post(
  '/activar-reporte-prueba',
  rateLimitByKey({ windowMs: 60000, max: 30 }),
  requireAuth,
  activarReportePrueba
);

puiRouter.post(
  '/activar-reporte',
  rateLimitByKey({ windowMs: 60000, max: 30 }),
  requireAuth,
  activarReporte
);

puiRouter.post(
  '/desactivar-reporte',
  rateLimitByKey({ windowMs: 60000, max: 30 }),
  requireAuth,
  desactivarReporte
);

