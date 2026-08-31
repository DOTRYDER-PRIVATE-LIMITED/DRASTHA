import { ProcessedTelemetry } from '../types/telemetry.types.js';
import { parseTelemetryPayload } from '../parsers/telemetry.parser.js';
import { telemetryService } from './telemetry.service.js';

export interface ProxyFetchResult {
    success: boolean;
    data?: ProcessedTelemetry;
    raw?: any;
    error?: string;
    targetUrl: string;
}

export async function proxyFetchGateway(gatewayUrl = 'http://192.168.4.1/data', timeoutMs = 3000): Promise<ProxyFetchResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(gatewayUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json, text/plain, */*'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return {
                success: false,
                targetUrl: gatewayUrl,
                error: `Gateway returned status HTTP ${response.status}: ${response.statusText}`
            };
        }

        const text = await response.text();
        let jsonPayload: any;

        try {
            jsonPayload = JSON.parse(text);
        } catch {
            jsonPayload = text;
        }

        // Process through telemetry service
        const processed = await telemetryService.ingestTelemetry(jsonPayload, 'GATEWAY_PROXY');

        return {
            success: true,
            data: processed,
            raw: jsonPayload,
            targetUrl: gatewayUrl
        };
    } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === 'AbortError';
        return {
            success: false,
            targetUrl: gatewayUrl,
            error: isAbort ? `Gateway request timed out after ${timeoutMs}ms` : (err.message || 'Connection failed')
        };
    }
}
