import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../../database/client/supabase.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
    const dbHealth = await checkDatabaseHealth();
    return res.status(200).json({
        status: 'online',
        system: 'DRASHTA Industrial IoT Worker Safety Gateway',
        uptime: process.uptime(),
        database: dbHealth,
        timestamp: new Date().toISOString()
    });
});

healthRouter.get('/db-status', async (_req: Request, res: Response) => {
    const status = await checkDatabaseHealth();
    return res.status(200).json(status);
});
