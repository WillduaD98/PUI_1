import { Router } from 'express';
import { requireApiAuth } from '../../../middleware/auth.js';
import { puiSyncBulkUpsert, puiSyncDeactivate, puiSyncList, puiSyncStatus, puiSyncUpsert } from '../../../controllers/puiSyncController.js';

export const puiSyncRouter = Router();

puiSyncRouter.post('/upsert', requireApiAuth, puiSyncUpsert);
puiSyncRouter.post('/bulk-upsert', requireApiAuth, puiSyncBulkUpsert);
puiSyncRouter.post('/deactivate', requireApiAuth, puiSyncDeactivate);
puiSyncRouter.get('/status', requireApiAuth, puiSyncStatus);
puiSyncRouter.get('/records', requireApiAuth, puiSyncList);
