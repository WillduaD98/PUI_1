import { Router } from 'express';
import { rateLimitByKey } from '../middleware/rateLimit.js';
import { requirePuiAuth, requirePuiTestAuth } from '../middleware/auth.js';
import { puiLogin } from '../controllers/puiAuthController.js';
import { activarReporte, activarReportePrueba, desactivarReporte } from '../controllers/puiReportController.js';

export const puiRouter = Router();

const ACTIVAR_REPORTE_TIMEOUT_MS = 15000;
const ACTIVAR_REPORTE_TIMEOUT_MESSAGE = 'No fue posible completar la conexión.';

function requestTimeout(ms: number) {
  return (_req: any, res: any, next: any) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) res.status(504).json({ message: ACTIVAR_REPORTE_TIMEOUT_MESSAGE });
    }, ms);
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}

puiRouter.post(
  '/login',
  rateLimitByKey({ windowMs: 60000, max: 15 }),
  puiLogin
);

puiRouter.post(
  '/activar-reporte-prueba',
  rateLimitByKey({ windowMs: 60000, max: 30 }),
  requirePuiTestAuth,
  requestTimeout(ACTIVAR_REPORTE_TIMEOUT_MS),
  activarReportePrueba
);

puiRouter.post(
  '/activar-reporte',
  rateLimitByKey({ windowMs: 60000, max: 30 }),
  requirePuiAuth,
  requestTimeout(ACTIVAR_REPORTE_TIMEOUT_MS),
  activarReporte
);

puiRouter.post(
  '/desactivar-reporte',
  rateLimitByKey({ windowMs: 60000, max: 30 }),
  requirePuiAuth,
  requestTimeout(ACTIVAR_REPORTE_TIMEOUT_MS),
  desactivarReporte
);
