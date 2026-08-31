import { Router, Request, Response } from 'express';
import { proxyFetchGateway } from '../services/gateway-proxy.service.js';

export const gatewayProxyRouter = Router();

/**
 * GET /api/gateway-proxy
 * Bridges local ESP32 AP (192.168.4.1) or custom hardware IP to the cloud dashboard
 */
gatewayProxyRouter.get('/gateway-proxy', async (req: Request, res: Response) => {
    try {
        const targetIp = (req.query.ip as string) || '192.168.4.1';
        const targetUrl = targetIp.startsWith('http://') || targetIp.startsWith('https://') 
            ? targetIp 
            : `http://${targetIp}/data`;

        const result = await proxyFetchGateway(targetUrl, 3000);

        if (!result.success) {
            return res.status(502).json({
                error: 'Gateway unreachable',
                message: result.error,
                target: result.targetUrl
            });
        }

        return res.status(200).json(result.data);
    } catch (err: any) {
        return res.status(500).json({
            error: 'Proxy execution error',
            message: err.message || 'Unknown error'
        });
    }
});
