import { getSupabaseClient } from '../client/supabase.js';

export interface DbAlertRow {
    id?: string;
    timestamp: string;
    device_id: string;
    worker_id: string;
    alert_type: string;
    severity: 'WARNING' | 'CRITICAL';
    parameter: string;
    value: string;
    threshold: string;
    status: 'ACTIVE' | 'RESOLVED';
    message: string;
    created_at?: string;
    resolved_at?: string | null;
}

export async function insertAlertRecord(alert: DbAlertRow): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { error } = await supabase.from('alerts').insert([alert]);
        if (error) {
            console.warn('[Alert Query] Insert error:', error.message);
            return false;
        }
        return true;
    } catch (err: any) {
        console.warn('[Alert Query] Insert exception:', err.message || err);
        return false;
    }
}

export async function resolveActiveAlert(alertType: string, deviceId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('alerts')
            .update({
                status: 'RESOLVED',
                resolved_at: new Date().toISOString()
            })
            .eq('alert_type', alertType)
            .eq('device_id', deviceId)
            .eq('status', 'ACTIVE');

        if (error) return false;
        return true;
    } catch {
        return false;
    }
}

export async function getAlertHistory(limit = 100): Promise<DbAlertRow[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data as DbAlertRow[];
    } catch {
        return [];
    }
}
