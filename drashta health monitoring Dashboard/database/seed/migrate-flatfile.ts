import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';
import { getSupabaseClient } from '../client/supabase.js';
import { DbTelemetryRow } from '../queries/telemetry.queries.js';

dotenv.config();

export async function migrateFlatFileToPostgres(): Promise<{
    total: number;
    migrated: number;
    skipped: number;
    failed: number;
    error?: string;
}> {
    const filePath = path.join(process.cwd(), 'sensor_records.json');
    const supabase = getSupabaseClient();

    if (!supabase) {
        return {
            total: 0,
            migrated: 0,
            skipped: 0,
            failed: 0,
            error: 'Supabase client is not configured (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required).'
        };
    }

    try {
        const rawContent = await fs.readFile(filePath, 'utf-8');
        const records: any[] = JSON.parse(rawContent);

        if (!Array.isArray(records) || records.length === 0) {
            return { total: 0, migrated: 0, skipped: 0, failed: 0 };
        }

        let migrated = 0;
        let skipped = 0;
        let failed = 0;

        // Process in batches of 50
        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const rows: DbTelemetryRow[] = batch.map((r) => ({
                timestamp: r.timestamp || new Date().toISOString(),
                device_id: 'NTPC_SENSOR_BOX_01',
                worker_id: 'WK-014',
                bpm: typeof r.bpm === 'number' ? r.bpm : 0,
                spo2: typeof r.o2 === 'number' ? r.o2 : (typeof r.spo2 === 'number' ? r.spo2 : 0),
                body_temp: typeof r.body === 'number' ? r.body : 0,
                bp_sys: typeof r.bp_sys === 'number' ? r.bp_sys : 0,
                bp_dia: typeof r.bp_dia === 'number' ? r.bp_dia : 0,
                ambient_temp: typeof r.temp === 'number' ? r.temp : 0,
                pressure: typeof r.pressure === 'number' ? r.pressure : 1013.25,
                altitude: typeof r.alt === 'number' ? r.alt : 0,
                distance: typeof r.dist === 'number' ? r.dist : 0,
                air_quality: typeof r.gas === 'number' ? r.gas : 0,
                oxygen_env: typeof r.oxygen_env === 'number' ? r.oxygen_env : 20.9,
                co: typeof r.co === 'number' ? r.co : 0,
                strain_load: typeof r.weight === 'number' ? r.weight : 0,
                ax: typeof r.ax === 'number' ? r.ax : 0,
                ay: typeof r.ay === 'number' ? r.ay : 0,
                az: typeof r.az === 'number' ? r.az : 9.81,
                latitude: typeof r.lat === 'number' ? r.lat : 0,
                longitude: typeof r.lng === 'number' ? r.lng : 0,
                digital_sensor: r.digital_sensor ? 1 : 0,
            }));

            const { error } = await supabase.from('telemetry').insert(rows);
            if (error) {
                console.error(`[Migration] Error inserting batch ${i}:`, error.message);
                failed += batch.length;
            } else {
                migrated += batch.length;
            }
        }

        return {
            total: records.length,
            migrated,
            skipped,
            failed
        };
    } catch (err: any) {
        return {
            total: 0,
            migrated: 0,
            skipped: 0,
            failed: 0,
            error: err.message || 'Migration failed'
        };
    }
}
