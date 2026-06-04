import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { setLatestPuiTokenJti } from '../middleware/auth.js';
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

  let passwordOk = false;
  try {
    if (uname !== env.PUI_usuario) passwordOk = false;
    else {
      passwordOk = isBcryptHash(env.PUI_PASSWORD)
        ? await bcrypt.compare(clave, env.PUI_PASSWORD)
        : clave === env.PUI_PASSWORD;
    }
  } catch {
    passwordOk = false;
  }

  if (!passwordOk) {
    console.info('[PUI] login_failed', { at: new Date().toISOString(), ip: req.ip, usuario: uname });
    return sendError(res, 401, 'Credenciales inválidas');
  }

  const jti = randomUUID();
  const signOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any, jwtid: jti, audience: 'pui' };
  const token = jwt.sign({ sub: uname }, env.JWT_SECRET, signOptions);
  setLatestPuiTokenJti(jti);

  console.info('[PUI] login_success', { at: new Date().toISOString(), ip: req.ip, usuario: uname });
  return sendSuccess(res, 200, {
    token,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN
  });
}
