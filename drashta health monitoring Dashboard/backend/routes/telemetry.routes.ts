import { Router, Request, Response } from 'express';
import { telemetryService } from '../services/telemetry.service.js';

export const telemetryRouter = Router();

/**
 * POST /api/telemetry
 * Primary hardware ingestion endpoint for ESP32-S3 sensor box and direct telemetry dispatch
 */
telemetryRouter.post('/telemetry', async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
            return res.status(400).json({ error: 'Empty telemetry payload received' });
        }

        const processed = await telemetryService.ingestTelemetry(payload, 'HTTP_POST');

        return res.status(200).json({
            success: true,
            status: 'INGESTED',
            record: processed
        });
    } catch (err: any) {
        console.error('[Telemetry Route] Error during ingestion:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal telemetry ingestion error'
        });
    }
});

/**
 * GET /api/telemetry
 * Supports query param ingestion (e.g. ?bpm=80&spo2=98) or retrieves latest telemetry
 */
telemetryRouter.get('/telemetry', async (req: Request, res: Response) => {
    try {
        if (Object.keys(req.query).length > 0) {
            const processed = await telemetryService.ingestTelemetry(req.query as any, 'HTTP_GET_QUERY');
            return res.status(200).json({
                success: true,
                status: 'INGESTED',
                record: processed
            });
        }

        const latest = telemetryService.getLatest();
        return res.status(200).json(latest);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Error processing telemetry' });
    }
});

/**
 * GET /api/hardware-status
 * Checks if the physical Safety Box or ESP32 is actively communicating with the backend
 */
telemetryRouter.get('/hardware-status', (req: Request, res: Response) => {
    try {
        const status = telemetryService.getHardwareStatus();
        return res.status(200).json(status);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Error checking hardware status' });
    }
});

/**
 * GET /api/latest
 * Returns the most recent sensor reading from memory or database
 */
telemetryRouter.get('/latest', async (req: Request, res: Response) => {
    try {
        const deviceId = req.query.device_id as string | undefined;
        let latest = telemetryService.getLatest();
        const hwStatus = telemetryService.getHardwareStatus();

        // If local latest is empty default vitals, attempt DB fetch
        if (latest.bpm === 0 && latest.spo2 === 0) {
            const dbLatest = await telemetryService.getLatestFromDb(deviceId);
            if (dbLatest) {
                latest = dbLatest;
            }
        }

        return res.status(200).json({
            ...latest,
            _hardwareStatus: hwStatus
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Error fetching latest telemetry' });
    }
});

/**
 * GET /api/history
 * Returns the chronological telemetry history series
 */
telemetryRouter.get('/history', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
        const deviceId = req.query.device_id as string | undefined;

        let history = telemetryService.getHistory(limit);
        if (history.length === 0) {
            history = await telemetryService.getHistoryFromDb(limit, deviceId);
        }

        return res.status(200).json(history);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Error fetching telemetry history' });
    }
});

/**
 * POST /api/clear-history
 * Clears the in-memory cache and resets active session records
 */
telemetryRouter.post('/clear-history', (req: Request, res: Response) => {
    try {
        telemetryService.clearHistory();
        return res.status(200).json({ success: true, message: 'History and cache cleared successfully' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to clear history' });
    }
});
