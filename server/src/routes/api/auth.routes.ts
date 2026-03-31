import { Router } from 'express';
import { rateLimitByKey } from '../../middleware/rateLimit.js';
import { login } from '../../controllers/authController.js';

export const authRouter = Router();

authRouter.post(
    '/auth/login',
    rateLimitByKey({
        windowMs: 60000,
        max: 15
    }),
    login
)
