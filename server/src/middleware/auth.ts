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
