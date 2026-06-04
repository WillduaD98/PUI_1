import type { Response } from 'express';
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';

export function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

export function sendSuccess<T extends Record<string, unknown>>(res: Response, status: number, body: T) {
  return res.status(status).json({ success: true, ...body });
}

export function isCurpFormat(value: string): boolean {
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d{1}$/.test(value);
}

export function normalizeCurp(value: string): string {
  return value.trim().toUpperCase();
}

export function resolveCompanyIdFromHostname(hostname: string): string {
  const h = String(hostname || '').trim().toLowerCase();
  const m = h.match(/^pui-([a-z0-9-]+)\./);
  if (m && m[1]) return m[1];
  return env.PUI_COMPANY_DEFAULT_ID || 'default';
}

export function hashCurpForAudit(curp: string): string {
  const pepper = env.AUDIT_HASH_PEPPER || '';
  return createHash('sha256').update(`${normalizeCurp(curp)}${pepper}`).digest('hex');
}
