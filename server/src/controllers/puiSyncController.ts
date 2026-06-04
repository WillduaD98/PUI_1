import type { Request, Response } from 'express';
import { PuiSearchIndexModel, type PuiSearchSource, type PuiSearchStatus } from '../models/puiSearchIndex.js';
import { isCurpFormat, normalizeCurp } from './puiHelpers.js';

type UpsertBody = {
  companyId?: unknown;
  externalClientId?: unknown;
  curp?: unknown;
  nombre?: unknown;
  primer_apellido?: unknown;
  segundo_apellido?: unknown;
  fecha_nacimiento?: unknown;
  telefono?: unknown;
  correo?: unknown;
  direccion?: unknown;
  estatus?: unknown;
  source?: unknown;
  uploadId?: unknown;
};

function normalizeString(value: unknown, maxLen: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!v) return undefined;
  if (v.length > maxLen) return undefined;
  return v;
}

function normalizeCurpInput(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const curp = normalizeCurp(value);
  if (curp.length !== 18) return undefined;
  if (!isCurpFormat(curp)) return undefined;
  return curp;
}

function parseUpsertBody(body: unknown): { ok: true; doc: any } | { ok: false } {
  if (!body || typeof body !== 'object') return { ok: false };
  const b = body as UpsertBody;
  const companyId = normalizeString(b.companyId, 64);
  const curp = normalizeCurpInput(b.curp);
  if (!companyId || !curp) return { ok: false };
  const sourceRaw = normalizeString(b.source, 32) as PuiSearchSource | undefined;
  const estatusRaw = normalizeString(b.estatus, 16) as PuiSearchStatus | undefined;
  if (sourceRaw !== 'nebur_sync' && sourceRaw !== 'excel_upload') return { ok: false };
  if (estatusRaw !== 'active' && estatusRaw !== 'inactive') return { ok: false };

  const doc = {
    companyId,
    curp,
    source: sourceRaw,
    estatus: estatusRaw,
    externalClientId: normalizeString(b.externalClientId, 128),
    nombre: normalizeString(b.nombre, 50),
    primer_apellido: normalizeString(b.primer_apellido, 50),
    segundo_apellido: normalizeString(b.segundo_apellido, 50),
    fecha_nacimiento: normalizeString(b.fecha_nacimiento, 10),
    telefono: normalizeString(b.telefono, 15),
    correo: normalizeString(b.correo, 80),
    direccion: normalizeString(b.direccion, 500),
    uploadId: normalizeString(b.uploadId, 128),
    lastSyncedAt: new Date()
  };
  return { ok: true, doc };
}

export async function puiSyncUpsert(req: Request, res: Response) {
  const parsed = parseUpsertBody(req.body);
  if (!parsed.ok) return res.status(400).json({ message: 'invalid payload' });
  const { companyId, curp, ...rest } = parsed.doc;
  await PuiSearchIndexModel.updateOne(
    { companyId, curp },
    { $set: { ...rest }, $setOnInsert: { companyId, curp } },
    { upsert: true }
  ).exec();
  return res.status(200).json({ success: true, companyId, curp });
}

export async function puiSyncBulkUpsert(req: Request, res: Response) {
  const items = Array.isArray((req.body as any)?.items) ? (req.body as any).items : null;
  if (!items) return res.status(400).json({ message: 'invalid payload' });
  const ops: any[] = [];
  const companyIds = new Set<string>();
  for (const item of items) {
    const parsed = parseUpsertBody(item);
    if (!parsed.ok) continue;
    const { companyId, curp, ...rest } = parsed.doc;
    companyIds.add(companyId);
    ops.push({
      updateOne: {
        filter: { companyId, curp },
        update: { $set: { ...rest }, $setOnInsert: { companyId, curp } },
        upsert: true
      }
    });
  }
  if (ops.length === 0) return res.status(400).json({ message: 'no valid items' });
  await PuiSearchIndexModel.bulkWrite(ops, { ordered: false });
  return res.status(200).json({ success: true, upserted: ops.length, companyIds: Array.from(companyIds) });
}

export async function puiSyncDeactivate(req: Request, res: Response) {
  const companyId = normalizeString((req.body as any)?.companyId, 64);
  const curp = normalizeCurpInput((req.body as any)?.curp);
  if (!companyId || !curp) return res.status(400).json({ message: 'invalid payload' });
  await PuiSearchIndexModel.updateOne({ companyId, curp }, { $set: { estatus: 'inactive', lastSyncedAt: new Date() } }).exec();
  return res.status(200).json({ success: true, companyId, curp });
}

export async function puiSyncStatus(req: Request, res: Response) {
  const companyId = normalizeString(String(req.query.companyId || ''), 64);
  const filter = companyId ? { companyId } : {};
  const total = await PuiSearchIndexModel.countDocuments(filter).exec();
  return res.status(200).json({ success: true, total, ...(companyId ? { companyId } : {}) });
}

export async function puiSyncList(req: Request, res: Response) {
  const companyId = normalizeString(req.query.companyId, 64);
  if (!companyId) return res.status(400).json({ message: 'invalid payload' });

  const curpRaw = req.query.curp;
  const curp = curpRaw !== undefined ? normalizeCurpInput(curpRaw) : undefined;
  if (curpRaw !== undefined && !curp) return res.status(400).json({ message: 'invalid payload' });

  const estatusRaw = req.query.estatus;
  const estatus = estatusRaw !== undefined ? (normalizeString(estatusRaw, 16) as PuiSearchStatus | undefined) : undefined;
  if (estatusRaw !== undefined && estatus !== 'active' && estatus !== 'inactive') {
    return res.status(400).json({ message: 'invalid payload' });
  }

  const sourceRaw = req.query.source;
  const source = sourceRaw !== undefined ? (normalizeString(sourceRaw, 32) as PuiSearchSource | undefined) : undefined;
  if (sourceRaw !== undefined && source !== 'nebur_sync' && source !== 'excel_upload') {
    return res.status(400).json({ message: 'invalid payload' });
  }

  const limitRaw = req.query.limit;
  const skipRaw = req.query.skip;
  const limitNum = typeof limitRaw === 'string' ? Number(limitRaw) : Array.isArray(limitRaw) ? Number(limitRaw[0]) : NaN;
  const skipNum = typeof skipRaw === 'string' ? Number(skipRaw) : Array.isArray(skipRaw) ? Number(skipRaw[0]) : NaN;
  const limit = Number.isFinite(limitNum) ? Math.max(1, Math.min(200, Math.trunc(limitNum))) : 50;
  const skip = Number.isFinite(skipNum) ? Math.max(0, Math.trunc(skipNum)) : 0;

  const filter: Record<string, unknown> = { companyId };
  if (curp) filter.curp = curp;
  if (estatus) filter.estatus = estatus;
  if (source) filter.source = source;

  const [total, items] = await Promise.all([
    PuiSearchIndexModel.countDocuments(filter).exec(),
    PuiSearchIndexModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean().exec()
  ]);

  return res.status(200).json({ success: true, companyId, total, skip, limit, items });
}
