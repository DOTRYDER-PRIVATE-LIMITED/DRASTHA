import { ProcessedTelemetry, RawTelemetryPayload } from '../types/telemetry.types.js';
import { parseTelemetryPayload } from '../parsers/telemetry.parser.js';
import { generateAlertLogs } from '../rules/alert.rules.js';
import { insertTelemetryRecord, getLatestTelemetryRecord, getTelemetryHistoryRecords, insertRawTelemetry, DbTelemetryRow } from '../../database/queries/telemetry.queries.js';
import { insertAlertRecord } from '../../database/queries/alerts.queries.js';
import { updateDeviceHeartbeat } from '../../database/queries/devices.queries.js';

class TelemetryService {
    private historyCache: ProcessedTelemetry[] = [];
    private latestRecord: ProcessedTelemetry | null = null;
    private lastIngestedAt: number | null = null;
    private maxCacheSize = 1000;

    constructor() {
        this.initializeDefaultState();
    }

    private initializeDefaultState() {
        this.latestRecord = {
            bpm: 0,
            spo2: 0,
            bodyTemp: 0,
            bp_sys: 0,
            bp_dia: 0,
            ambientTemp: 22.0,
            pressure: 1013.25,
            altitude: 0,
            distance: 0,
            ax: 0,
            ay: 0,
            az: 9.81,
            airQuality: 35,
            oxygen: 20.9,
            co: 0,
            strainLoad: 0,
            lat: 0,
            lng: 0,
            digital_sensor: 0,
            alerts: {
                highBpm: false,
                lowBpm: false,
                lowSpo2: false,
                highBodyTemp: false,
                toxicGas: false,
                lowOxygen: false,
                fall: false,
                obstacle: false,
                highCo: false
            },
            timestamp: new Date().toISOString(),
            device_id: 'NTPC_SENSOR_BOX_01',
            worker_id: 'WK-014'
        };
    }

    public async ingestTelemetry(raw: RawTelemetryPayload | string, source = 'HTTP_INGESTION'): Promise<ProcessedTelemetry> {
        this.lastIngestedAt = Date.now();
        const processed = parseTelemetryPayload(raw, this.latestRecord);
        this.latestRecord = processed;

        // Push to in-memory circular cache
        this.historyCache.push(processed);
        if (this.historyCache.length > this.maxCacheSize) {
            this.historyCache.shift();
        }

        // Asynchronous non-blocking persistence
        this.persistTelemetryAsync(processed, raw, source);

        return processed;
    }

    private async persistTelemetryAsync(record: ProcessedTelemetry, raw: any, source: string) {
        try {
            // 1. Raw telemetry logging
            insertRawTelemetry(record.device_id || 'NTPC_SENSOR_BOX_01', source, raw);

            // 2. Structured telemetry row
            const dbRow: DbTelemetryRow = {
                timestamp: record.timestamp,
                device_id: record.device_id || 'NTPC_SENSOR_BOX_01',
                worker_id: record.worker_id || 'WK-014',
                bpm: record.bpm,
                spo2: record.spo2,
                body_temp: record.bodyTemp,
                bp_sys: record.bp_sys,
                bp_dia: record.bp_dia,
                ambient_temp: record.ambientTemp,
                pressure: record.pressure,
                altitude: record.altitude,
                distance: record.distance,
                air_quality: record.airQuality,
                oxygen_env: record.oxygen,
                co: record.co,
                strain_load: record.strainLoad,
                ax: record.ax,
                ay: record.ay,
                az: record.az,
                latitude: record.lat,
                longitude: record.lng,
                digital_sensor: record.digital_sensor ?? 0,
            };
            await insertTelemetryRecord(dbRow);

            // 3. Heartbeat update
            updateDeviceHeartbeat(record.device_id || 'NTPC_SENSOR_BOX_01', 'ONLINE');

            // 4. Alerts generation & logging
            const activeAlerts = generateAlertLogs(record);
            for (const alert of activeAlerts) {
                insertAlertRecord({
                    timestamp: record.timestamp,
                    device_id: record.device_id || 'NTPC_SENSOR_BOX_01',
                    worker_id: record.worker_id || 'WK-014',
                    alert_type: alert.type,
                    severity: alert.severity,
                    parameter: alert.parameter,
                    value: alert.value,
                    threshold: 'EXCEEDED',
                    status: 'ACTIVE',
                    message: `${alert.type} with value ${alert.value}`
                });
            }
        } catch (err) {
            console.warn('[TelemetryService] Async persistence error:', err);
        }
    }

    public getLatest(): ProcessedTelemetry {
        return this.latestRecord || {
            bpm: 0,
            spo2: 0,
            bodyTemp: 0,
            bp_sys: 0,
            bp_dia: 0,
            ambientTemp: 22.0,
            pressure: 1013.25,
            altitude: 0,
            distance: 0,
            ax: 0,
            ay: 0,
            az: 9.81,
            airQuality: 35,
            oxygen: 20.9,
            co: 0,
            strainLoad: 0,
            lat: 0,
            lng: 0,
            digital_sensor: 0,
            alerts: {
                highBpm: false,
                lowBpm: false,
                lowSpo2: false,
                highBodyTemp: false,
                toxicGas: false,
                lowOxygen: false,
                fall: false,
                obstacle: false,
                highCo: false
            },
            timestamp: new Date().toISOString()
        };
    }

    public async getLatestFromDb(deviceId?: string): Promise<ProcessedTelemetry | null> {
        const dbRow = await getLatestTelemetryRecord(deviceId);
        if (!dbRow) return null;

        return parseTelemetryPayload({
            bpm: Number(dbRow.bpm),
            spo2: Number(dbRow.spo2),
            bodyTemp: Number(dbRow.body_temp),
            bp_sys: dbRow.bp_sys,
            bp_dia: dbRow.bp_dia,
            ambientTemp: Number(dbRow.ambient_temp),
            pressure: Number(dbRow.pressure),
            altitude: Number(dbRow.altitude),
            distance: Number(dbRow.distance),
            airQuality: dbRow.air_quality,
            oxygen: Number(dbRow.oxygen_env),
            co: Number(dbRow.co),
            strainLoad: Number(dbRow.strain_load),
            ax: Number(dbRow.ax),
            ay: Number(dbRow.ay),
            az: Number(dbRow.az),
            lat: Number(dbRow.latitude),
            lng: Number(dbRow.longitude),
            digital_sensor: dbRow.digital_sensor,
            timestamp: dbRow.timestamp,
            device_id: dbRow.device_id,
            worker_id: dbRow.worker_id
        });
    }

    public getHistory(limit = 100): ProcessedTelemetry[] {
        if (this.historyCache.length === 0) return [];
        return this.historyCache.slice(-limit);
    }

    public async getHistoryFromDb(limit = 100, deviceId?: string): Promise<ProcessedTelemetry[]> {
        const dbRows = await getTelemetryHistoryRecords({ limit, deviceId });
        if (!dbRows || dbRows.length === 0) {
            return this.getHistory(limit);
        }

        return dbRows.map(row => parseTelemetryPayload({
            bpm: Number(row.bpm),
            spo2: Number(row.spo2),
            bodyTemp: Number(row.body_temp),
            bp_sys: row.bp_sys,
            bp_dia: row.bp_dia,
            ambientTemp: Number(row.ambient_temp),
            pressure: Number(row.pressure),
            altitude: Number(row.altitude),
            distance: Number(row.distance),
            airQuality: row.air_quality,
            oxygen: Number(row.oxygen_env),
            co: Number(row.co),
            strainLoad: Number(row.strain_load),
            ax: Number(row.ax),
            ay: Number(row.ay),
            az: Number(row.az),
            lat: Number(row.latitude),
            lng: Number(row.longitude),
            digital_sensor: row.digital_sensor,
            timestamp: row.timestamp,
            device_id: row.device_id,
            worker_id: row.worker_id
        })).reverse();
    }

    public clearHistory(): void {
        this.historyCache = [];
        this.lastIngestedAt = null;
        this.initializeDefaultState();
    }

    public getHardwareStatus(): { isConnected: boolean; lastSeen: string | null; elapsedMs: number | null } {
        if (!this.lastIngestedAt) {
            return { isConnected: false, lastSeen: null, elapsedMs: null };
        }
        const elapsed = Date.now() - this.lastIngestedAt;
        const isConnected = elapsed < 6000; // considered connected if packet received within 6 seconds
        return {
            isConnected,
            lastSeen: new Date(this.lastIngestedAt).toISOString(),
            elapsedMs: elapsed
        };
    }
}

export const telemetryService = new TelemetryService();
