import { getSupabaseClient } from '../client/supabase.js';

export interface DbTelemetryRow {
    id?: number;
    timestamp: string;
    device_id: string;
    worker_id: string;
    bpm: number;
    spo2: number;
    body_temp: number;
    bp_sys: number;
    bp_dia: number;
    ambient_temp: number;
    pressure: number;
    altitude: number;
    distance: number;
    air_quality: number;
    oxygen_env: number;
    co: number;
    strain_load: number;
    ax: number;
    ay: number;
    az: number;
    latitude: number;
    longitude: number;
    digital_sensor: number;
    created_at?: string;
}

export async function insertTelemetryRecord(record: DbTelemetryRow): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { error } = await supabase.from('telemetry').insert([record]);
        if (error) {
            console.warn('[Telemetry Query] Insert error:', error.message);
            return false;
        }
        return true;
    } catch (err: any) {
        console.warn('[Telemetry Query] Insert exception:', err.message || err);
        return false;
    }
}

export async function getLatestTelemetryRecord(deviceId?: string): Promise<DbTelemetryRow | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        let query = supabase
            .from('telemetry')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1);

        if (deviceId) {
            query = query.eq('device_id', deviceId);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
            return null;
        }
        return data[0] as DbTelemetryRow;
    } catch (err) {
        return null;
    }
}

export async function getTelemetryHistoryRecords(options: {
    limit?: number;
    deviceId?: string;
    workerId?: string;
    from?: string;
    to?: string;
}): Promise<DbTelemetryRow[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
        const limit = Math.min(options.limit || 300, 1000);
        let query = supabase
            .from('telemetry')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (options.deviceId) {
            query = query.eq('device_id', options.deviceId);
        }
        if (options.workerId) {
            query = query.eq('worker_id', options.workerId);
        }
        if (options.from) {
            query = query.gte('timestamp', options.from);
        }
        if (options.to) {
            query = query.lte('timestamp', options.to);
        }

        const { data, error } = await query;
        if (error || !data) return [];
        return data as DbTelemetryRow[];
    } catch (err) {
        return [];
    }
}

export async function insertRawTelemetry(deviceId: string, source: string, rawPayload: any): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        await supabase.from('raw_telemetry').insert([{
            device_id: deviceId,
            source,
            raw_payload: typeof rawPayload === 'object' ? rawPayload : { raw: String(rawPayload) },
            received_at: new Date().toISOString()
        }]);
    } catch {
        // Non-blocking telemetry capture
    }
}
