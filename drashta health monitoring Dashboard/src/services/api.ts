import { TelemetryData, AlertLogItem, DatabaseStatus } from '../types/telemetry.js';

export async function fetchLatestTelemetry(): Promise<TelemetryData | null> {
  try {
    const res = await fetch('/api/latest');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTelemetryHistory(limit = 100): Promise<TelemetryData[]> {
  try {
    const res = await fetch(`/api/history?limit=${limit}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchDirectGateway(gatewayIp = '192.168.4.1'): Promise<any> {
  const url = gatewayIp.startsWith('http') ? gatewayIp : `http://${gatewayIp}/data`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json, text/plain, */*' }
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function fetchGatewayProxy(gatewayIp = '192.168.4.1'): Promise<TelemetryData> {
  const res = await fetch(`/api/gateway-proxy?ip=${encodeURIComponent(gatewayIp)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Proxy error: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function postTelemetry(payload: Partial<TelemetryData>): Promise<boolean> {
  try {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchDatabaseStatus(): Promise<DatabaseStatus | null> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchHardwareStatus(): Promise<{ isConnected: boolean; lastSeen: string | null; elapsedMs: number | null } | null> {
  try {
    const res = await fetch('/api/hardware-status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function clearServerHistory(): Promise<boolean> {
  try {
    const res = await fetch('/api/clear-history', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
