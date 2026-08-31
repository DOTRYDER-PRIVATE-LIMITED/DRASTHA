import express, { Express } from 'express';
import cors from 'cors';
import { telemetryRouter } from './routes/telemetry.routes.js';
import { gatewayProxyRouter } from './routes/gateway-proxy.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { alertsRouter } from './routes/alerts.routes.js';
import { databaseRouter } from './routes/database.routes.js';

export function createExpressApp(): Express {
    const app = express();

    // Configure CORS for local AP mode, mobile browsers, and reverse proxying
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    }));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(express.text({ type: ['text/*', 'application/json'] }));

    // Mount API routes
    app.use('/api', telemetryRouter);
    app.use('/api', gatewayProxyRouter);
    app.use('/api', healthRouter);
    app.use('/api', alertsRouter);
    app.use('/api', databaseRouter);

    return app;
}
