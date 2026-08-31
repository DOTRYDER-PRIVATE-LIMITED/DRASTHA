import { Router, Request, Response } from 'express';
import { fetchAlertLogs, resolveAlert } from '../services/alerts.service.js';

export const alertsRouter = Router();

alertsRouter.get('/alerts', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const alerts = await fetchAlertLogs(limit);
        return res.status(200).json(alerts);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to fetch alerts' });
    }
});

alertsRouter.post('/alerts/resolve', async (req: Request, res: Response) => {
    try {
        const { alertType, deviceId } = req.body;
        if (!alertType) {
            return res.status(400).json({ error: 'alertType is required' });
        }

        const success = await resolveAlert(alertType, deviceId || 'NTPC_SENSOR_BOX_01');
        return res.status(200).json({ success });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to resolve alert' });
    }
});
