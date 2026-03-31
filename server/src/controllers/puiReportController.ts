import type { Request, Response } from 'express';
import { activateReport, deactivateReport } from '../services/puiReport.service.js';
import { isCurpFormat, normalizeCurp, sendError, sendSuccess } from './puiHelpers.js';

const SOURCE = 'PUI';

// Endpoint de homologación/conectividad:
// confirma que la PUI puede autenticarse y pegarle al servicio, sin activar monitoreo real de ninguna CURP.
export async function activarReportePrueba(req: Request, res: Response) {
  console.info('[PUI] activar-reporte-prueba', { at: new Date().toISOString(), ip: req.ip });
  return sendSuccess(res, 200, { message: 'Conectividad PUI correcta' });
}

export async function activarReporte(req: Request, res: Response) {
  const { curp } = (req.body || {}) as { curp?: unknown };
  if (typeof curp !== 'string') return sendError(res, 400, 'CURP requerida');

  const normalized = normalizeCurp(curp);
  if (!isCurpFormat(normalized)) return sendError(res, 400, 'CURP inválida');

  const rec = activateReport(normalized, SOURCE);

  console.info('[PUI] activar-reporte', {
    at: new Date().toISOString(),
    ip: req.ip,
    curp: rec.curp,
    status: rec.status
  });

  return sendSuccess(res, 200, {
    message: 'Reporte activado correctamente',
    data: { curp: rec.curp, status: rec.status }
  });
}

export async function desactivarReporte(req: Request, res: Response) {
  const { curp } = (req.body || {}) as { curp?: unknown };
  if (typeof curp !== 'string') return sendError(res, 400, 'CURP requerida');

  const normalized = normalizeCurp(curp);
  if (!isCurpFormat(normalized)) return sendError(res, 400, 'CURP inválida');

  const rec = deactivateReport(normalized, SOURCE);

  console.info('[PUI] desactivar-reporte', {
    at: new Date().toISOString(),
    ip: req.ip,
    curp: rec.curp,
    status: rec.status
  });

  return sendSuccess(res, 200, {
    message: 'Reporte desactivado correctamente',
    data: { curp: rec.curp, status: rec.status }
  });
}
