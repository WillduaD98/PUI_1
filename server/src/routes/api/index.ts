import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { puiSyncRouter } from './internal/pui-sync.routes.js';

export const apiRouter = Router();

apiRouter.use(authRouter);
apiRouter.use('/internal/pui-sync', puiSyncRouter);
