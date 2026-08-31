import { Router, Request, Response } from 'express';
import { migrateFlatFileToPostgres } from '../../database/seed/migrate-flatfile.js';

export const databaseRouter = Router();

databaseRouter.post('/admin/migrate-flatfile', async (_req: Request, res: Response) => {
    try {
        const result = await migrateFlatFileToPostgres();
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Migration execution failed' });
    }
});
