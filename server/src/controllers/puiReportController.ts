import type { Request, Response } from 'express';
import { activateReportById, deactivateReportById } from '../services/puiReport.service.js';
import { hashCurpForAudit, isCurpFormat, normalizeCurp, resolveCompanyIdFromHostname } from './puiHelpers.js';
import { PuiSearchIndexModel } from '../models/puiSearchIndex.js';
import { PuiAuditLogModel } from '../models/puiAuditLog.js';
import { PuiReportSessionModel } from '../models/puiReportSession.js';
import { env } from '../config/env.js';

const SOURCE = 'PUI';

const ACTIVAR_REPORTE_SUCCESS_MESSAGE = 'La solicitud de activación del reporte de búsqueda se recibió correctamente.';
const ACTIVAR_REPORTE_BAD_REQUEST_MESSAGE = 'La solicitud contiene datos inválidos o con formato incorrecto.';
const ACTIVAR_REPORTE_INTERNAL_ERROR_MESSAGE = 'Ocurrió un error interno al procesar la solicitud.';
const ACTIVAR_REPORTE_PRUEBA_SUCCESS_MESSAGE = 'Petición recibida y procesada de manera correcta.';
const ACTIVAR_REPORTE_PRUEBA_INTERNAL_ERROR_MESSAGE = 'Ocurrió un error interno al procesar la prueba del Webhook';
const DESACTIVAR_REPORTE_SUCCESS_MESSAGE = 'Registro de finalización de búsqueda histórica guardado correctamente';

type AuditLogWrite = {
  requestId: string;
  companyId: string;
  endpoint: string;
  source: 'PUI';
  method: string;
  httpStatus: number;
  matched?: boolean;
  matchCount?: number;
  curpHash?: string;
  durationMs: number;
  errorMessage?: string;
};

async function writeAuditLog(doc: AuditLogWrite) {
  try {
    await PuiAuditLogModel.updateOne(
      { requestId: doc.requestId },
      { $set: doc, $setOnInsert: { requestId: doc.requestId } },
      { upsert: true }
    ).exec();
  } catch {}
}

function isUuidV4(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
}

function isDateIsoYyyyMmDd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (y < 1000 || y > 9999) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function validateOptionalString(value: unknown, min: number, max: number): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v.length >= min && v.length <= max;
}

export function validateActivarReporteBody(body: unknown): { ok: true; id: string; curp: string } | { ok: false } {
  if (!body || typeof body !== 'object') return { ok: false };
  const b = body as Record<string, unknown>;

  const rawId = b.id;
  const rawCurp = b.curp;
  const rawLugarNacimiento = b.lugar_nacimiento;

  if (typeof rawId !== 'string') return { ok: false };
  if (typeof rawCurp !== 'string') return { ok: false };
  if (typeof rawLugarNacimiento !== 'string') return { ok: false };

  const id = rawId.trim();
  if (id.length < 36 || id.length > 75) return { ok: false };
  const idMatch = id.match(/^(?<fub>.+)-(?<uuid>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/);
  if (!idMatch || !idMatch.groups) return { ok: false };
  const fub = idMatch.groups.fub.trim();
  const uuidPart = idMatch.groups.uuid;
  if (fub.length < 1) return { ok: false };
  if (!isUuidV4(uuidPart)) return { ok: false };

  const curp = normalizeCurp(rawCurp);
  if (curp.length !== 18) return { ok: false };
  if (!isCurpFormat(curp)) return { ok: false };

  const lugarNacimiento = rawLugarNacimiento.trim();
  if (lugarNacimiento.length < 0 || lugarNacimiento.length > 20) return { ok: false };

  const optionalValid =
    validateOptionalString(b.nombre, 0, 50) &&
    validateOptionalString(b.primer_apellido, 0, 50) &&
    validateOptionalString(b.segundo_apellido, 0, 50) &&
    validateOptionalString(b.fecha_nacimiento, 10, 10) &&
    validateOptionalString(b.fecha_desaparicion, 10, 10) &&
    validateOptionalString(b.sexo_asignado, 1, 1) &&
    validateOptionalString(b.telefono, 0, 15) &&
    validateOptionalString(b.correo, 0, 50) &&
    validateOptionalString(b.direccion, 0, 500) &&
    validateOptionalString(b.calle, 0, 50) &&
    validateOptionalString(b.numero, 0, 20) &&
    validateOptionalString(b.colonia, 0, 50) &&
    validateOptionalString(b.codigo_postal, 0, 5) &&
    validateOptionalString(b.municipio_o_alcaldia, 0, 100) &&
    validateOptionalString(b.entidad_federativa, 0, 40);

  if (!optionalValid) return { ok: false };

  if (typeof b.fecha_nacimiento === 'string' && !isDateIsoYyyyMmDd(b.fecha_nacimiento.trim())) return { ok: false };
  if (typeof b.fecha_desaparicion === 'string' && !isDateIsoYyyyMmDd(b.fecha_desaparicion.trim())) return { ok: false };

  if (typeof b.sexo_asignado === 'string') {
    const sx = b.sexo_asignado.trim();
    if (sx !== 'H' && sx !== 'M' && sx !== 'X') return { ok: false };
  }

  if (typeof b.codigo_postal === 'string') {
    const cp = b.codigo_postal.trim();
    if (cp.length > 0 && !/^\d{5}$/.test(cp)) return { ok: false };
  }

  return { ok: true, id, curp };
}

export function validateDesactivarReporteBody(body: unknown): { ok: true; id: string } | { ok: false } {
  if (!body || typeof body !== 'object') return { ok: false };
  const b = body as Record<string, unknown>;
  const keys = Object.keys(b);
  if (keys.length !== 1 || keys[0] !== 'id') return { ok: false };
  if (typeof b.id !== 'string') return { ok: false };
  const id = b.id.trim();
  if (id.length < 36 || id.length > 75) return { ok: false };
  const idMatch = id.match(/^(?<fub>.+)-(?<uuid>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/);
  if (!idMatch || !idMatch.groups) return { ok: false };
  const fub = idMatch.groups.fub.trim();
  const uuidPart = idMatch.groups.uuid;
  if (fub.length < 1) return { ok: false };
  if (!isUuidV4(uuidPart)) return { ok: false };
  return { ok: true, id };
}

export async function activarReportePrueba(req: Request, res: Response) {
  const validated = validateActivarReporteBody(req.body);
  if (!validated.ok) return res.status(400).json({ message: ACTIVAR_REPORTE_BAD_REQUEST_MESSAGE });
  const startedAt = Date.now();
  const requestId = validated.id;
  const companyId = resolveCompanyIdFromHostname(req.hostname);
  try {
    const curpHash = hashCurpForAudit(validated.curp);
    let matchCount = 0;
    if (env.MONGODB_URI) {
      matchCount = await PuiSearchIndexModel.countDocuments({ companyId, curp: validated.curp, estatus: 'active' }).exec();
      await writeAuditLog({
        requestId,
        companyId,
        endpoint: '/activar-reporte-prueba',
        source: 'PUI',
        method: 'POST',
        httpStatus: 200,
        matched: matchCount > 0,
        matchCount,
        curpHash,
        durationMs: Date.now() - startedAt
      });
    }
    console.info('[PUI] activar-reporte-prueba', { at: new Date().toISOString(), ip: req.ip, id: validated.id, companyId });
    if (res.headersSent) return;
    return res.status(200).json({ message: ACTIVAR_REPORTE_PRUEBA_SUCCESS_MESSAGE });
  } catch (error) {
    if (env.MONGODB_URI) {
      await writeAuditLog({
        requestId,
        companyId,
        endpoint: '/activar-reporte-prueba',
        source: 'PUI',
        method: 'POST',
        httpStatus: 500,
        curpHash: hashCurpForAudit(validated.curp),
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    console.error('[PUI] activar-reporte-prueba error', { at: new Date().toISOString(), id: validated.id, companyId, error });
    return res.status(500).json({ message: ACTIVAR_REPORTE_PRUEBA_INTERNAL_ERROR_MESSAGE });
  }
}

export async function activarReporte(req: Request, res: Response) {
  const validated = validateActivarReporteBody(req.body);
  if (!validated.ok) return res.status(400).json({ message: ACTIVAR_REPORTE_BAD_REQUEST_MESSAGE });
  const startedAt = Date.now();
  const requestId = validated.id;
  const companyId = resolveCompanyIdFromHostname(req.hostname);

  try {
    activateReportById(validated.id, validated.curp, SOURCE);
    if (env.MONGODB_URI) {
      await PuiReportSessionModel.updateOne(
        { companyId, puiId: validated.id },
        { $set: { curp: validated.curp, status: 'active', activatedAt: new Date() }, $setOnInsert: { companyId, puiId: validated.id } },
        { upsert: true }
      ).exec();
      const curpHash = hashCurpForAudit(validated.curp);
      const matchCount = await PuiSearchIndexModel.countDocuments({ companyId, curp: validated.curp, estatus: 'active' }).exec();
      await writeAuditLog({
        requestId,
        companyId,
        endpoint: '/activar-reporte',
        source: 'PUI',
        method: 'POST',
        httpStatus: 200,
        matched: matchCount > 0,
        matchCount,
        curpHash,
        durationMs: Date.now() - startedAt
      });
    }
    console.info('[PUI] activar-reporte', {
      at: new Date().toISOString(),
      ip: req.ip,
      id: validated.id,
      companyId
    });
    if (res.headersSent) return;
    return res.status(200).json({ message: ACTIVAR_REPORTE_SUCCESS_MESSAGE });
  } catch (error) {
    if (env.MONGODB_URI) {
      await writeAuditLog({
        requestId,
        companyId,
        endpoint: '/activar-reporte',
        source: 'PUI',
        method: 'POST',
        httpStatus: 500,
        curpHash: hashCurpForAudit(validated.curp),
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    console.error('[PUI] activar-reporte error', { at: new Date().toISOString(), id: validated.id, companyId, error });
    return res.status(500).json({ message: ACTIVAR_REPORTE_INTERNAL_ERROR_MESSAGE });
  }
}

export async function desactivarReporte(req: Request, res: Response) {
  const validated = validateDesactivarReporteBody(req.body);
  if (!validated.ok) return res.status(400).json({ message: ACTIVAR_REPORTE_BAD_REQUEST_MESSAGE });
  const startedAt = Date.now();
  const requestId = validated.id;
  const companyId = resolveCompanyIdFromHostname(req.hostname);

  try {
    deactivateReportById(validated.id, SOURCE);
    if (env.MONGODB_URI) {
      const session = await PuiReportSessionModel.findOne({ companyId, puiId: validated.id }).exec();
      if (session) {
        session.status = 'inactive';
        session.deactivatedAt = new Date();
        await session.save();
      }
      await writeAuditLog({
        requestId,
        companyId,
        endpoint: '/desactivar-reporte',
        source: 'PUI',
        method: 'POST',
        httpStatus: 200,
        durationMs: Date.now() - startedAt
      });
    }
    console.info('[PUI] desactivar-reporte', { at: new Date().toISOString(), ip: req.ip, id: validated.id, companyId });
    if (res.headersSent) return;
    return res.status(200).json({ message: DESACTIVAR_REPORTE_SUCCESS_MESSAGE });
  } catch (error) {
    if (env.MONGODB_URI) {
      await writeAuditLog({
        requestId,
        companyId,
        endpoint: '/desactivar-reporte',
        source: 'PUI',
        method: 'POST',
        httpStatus: 500,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    console.error('[PUI] desactivar-reporte error', { at: new Date().toISOString(), id: validated.id, companyId, error });
    return res.status(500).json({ message: ACTIVAR_REPORTE_INTERNAL_ERROR_MESSAGE });
  }
}
