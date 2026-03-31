import { Router } from 'express';
import { rateLimitByKey } from '../middleware/rateLimit.js';
import { handleWebhookGet, handleWebhookPost} from '../controllers/webhookController.js';

import { apiRouter } from './api/index.js';
import { puiRouter } from './pui.routes.js';

export const webhookRouter = Router();

webhookRouter.use('/', puiRouter);
webhookRouter.use('/api', apiRouter);

webhookRouter.get('/webhook', handleWebhookGet);

webhookRouter.post(
    '/webhook',
    rateLimitByKey({
        windowMs: 60000,
        max: 15
    }),
    handleWebhookPost
);
