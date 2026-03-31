import express from 'express';
import {webhookRouter} from './routes/webhook.routes.js';
// import { repoRoot } from './config/paths.js'


export function createApp() {
    const app = express();
    
    app.disable('x-powered-by');
    if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1)

        app.use(express.json({ limit: '1mb' }));
        app.use(express.urlencoded({ extended: false }));

        app.use((_req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'no-referrer');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
            if (process.env.NODE_ENV === 'production') {
                res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
            }
            next();
        });

        app.get('/health', (_req, res) => {
            res.status(200).json({
                status: 'ok',
            });
        });
        app.use('/', webhookRouter);

        // const clientDistPath = path.join(repoRoot, 'client/dist');
        
        return app;
   }
