import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError, sendSuccess } from './puiHelpers.js';

function isBcryptHash(value: string): boolean {
  return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
}

export async function puiLogin(req: Request, res: Response) {
  const { usuario, clave } = (req.body || {}) as { usuario?: unknown; clave?: unknown };

  if (typeof usuario !== 'string' || typeof clave !== 'string') {
    return sendError(res, 400, 'usuario y clave son requeridos');
  }

  const uname = usuario.trim();
  if (uname !== env.PUI_usuario) {
    console.info('[PUI] login_failed', { at: new Date().toISOString(), ip: req.ip, usuario: uname });
    return sendError(res, 401, 'Credenciales inválidas');
  }

  let passwordOk = false;
  try {
    passwordOk = isBcryptHash(env.PUI_PASSWORD)
      ? await bcrypt.compare(clave, env.PUI_PASSWORD)
      : clave === env.PUI_PASSWORD;
  } catch {
    passwordOk = false;
  }

  if (!passwordOk) {
    console.info('[PUI] login_failed', { at: new Date().toISOString(), ip: req.ip, usuario: uname });
    return sendError(res, 401, 'Credenciales inválidas');
  }

  const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
  const token = jwt.sign({ sub: uname }, env.JWT_SECRET, signOptions);

  console.info('[PUI] login_success', { at: new Date().toISOString(), ip: req.ip, usuario: uname });
  return sendSuccess(res, 200, {
    token,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN
  });
}
