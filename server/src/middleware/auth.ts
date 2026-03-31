import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const hdr = String(req.headers.authorization || '');
    const parts = hdr.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
        jwt.verify(parts[1], env.JWT_SECRET);
        return next();
    } catch {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

function requireBearerAuth(opts: { expectedSub: string; unauthorizedMessage: string; forbiddenMessage: string }) {
    return (req: Request, res: Response, next: NextFunction) => {
        const hdr = String(req.headers.authorization || '');
        const parts = hdr.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ message: opts.unauthorizedMessage });
        }
        try {
            const payload = jwt.verify(parts[1], env.JWT_SECRET);
            const sub = typeof payload === 'object' && payload && 'sub' in payload ? (payload as any).sub : undefined;
            if (sub !== opts.expectedSub) {
                return res.status(403).json({ message: opts.forbiddenMessage });
            }
            return next();
        } catch {
            return res.status(401).json({ message: opts.unauthorizedMessage });
        }
    };
}

export const requirePuiAuth = requireBearerAuth({
    expectedSub: env.PUI_usuario,
    unauthorizedMessage: 'Credenciales no válidas, falta de autenticación o token expirado.',
    forbiddenMessage: 'Acceso no autorizado; verifica que el usuario PUI tenga permisos.'
});

export const requirePuiTestAuth = requireBearerAuth({
    expectedSub: env.PUI_usuario,
    unauthorizedMessage: 'Credenciales no válidas, verifica la contraseña registrada, falta de autenticación o Token expirado.',
    forbiddenMessage: 'Acceso no autorizado, verifica que el usuario PUI tenga acceso al Webhook.'
});
