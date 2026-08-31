import { getSupabaseClient } from '../client/supabase.js';

export interface DbDeviceRow {
    id?: string;
    device_id: string;
    device_type: string;
    name: string;
    status: string;
    firmware_version?: string;
    last_seen?: string;
}

export interface DbWorkerRow {
    id?: string;
    worker_code: string;
    name: string;
    department: string;
    assigned_device_id?: string;
}

export interface DbDeviceEventRow {
    id?: string;
    timestamp: string;
    device_id: string;
    worker_id?: string;
    event_type: string;
    event_data?: any;
}

export async function updateDeviceHeartbeat(deviceId: string, status = 'ONLINE'): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        await supabase
            .from('devices')
            .upsert({
                device_id: deviceId,
                status,
                last_seen: new Date().toISOString()
            }, { onConflict: 'device_id' });
    } catch {
        // Non-blocking heartbeat
    }
}

export async function insertDeviceEvent(event: DbDeviceEventRow): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        await supabase.from('device_events').insert([event]);
    } catch {
        // Non-blocking event recording
    }
}
