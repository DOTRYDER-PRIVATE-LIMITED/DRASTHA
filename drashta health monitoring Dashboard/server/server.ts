import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { createExpressApp } from '../backend/app.js';
import { checkDatabaseHealth } from '../database/client/supabase.js';

dotenv.config();

export async function startServer(port = 3000) {
    const app = createExpressApp();

    // Check database connection on startup
    const dbStatus = await checkDatabaseHealth();
    console.log(`[DRASHTA Database] Mode: ${dbStatus.provider}, Connected: ${dbStatus.connected}`);
    if (dbStatus.lastError) {
        console.warn(`[DRASHTA Database] Notice: ${dbStatus.lastError}`);
    }

    // Vite middleware for development vs static build in production
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`[DRASHTA Industrial Gateway] Listening on http://0.0.0.0:${port}`);
        console.log(`[DRASHTA Telemetry Ingestion] Active endpoint at http://0.0.0.0:${port}/api/telemetry`);
    });

    return server;
}
