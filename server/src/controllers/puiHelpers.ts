import type { Response } from 'express';

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

