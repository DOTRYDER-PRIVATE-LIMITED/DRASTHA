import { ProcessedTelemetry, TelemetryAlerts, AlertLogItem, SystemSeverity } from '../types/telemetry.types.js';

export function evaluateAlerts(data: Omit<ProcessedTelemetry, 'alerts'>): TelemetryAlerts {
    const {
        bpm,
        spo2,
        bodyTemp,
        airQuality,
        oxygen,
        co,
        distance,
        ax,
        ay,
        az
    } = data;

    // Safety Threshold Rules
    const highBpm = bpm > 120;
    const lowBpm = bpm > 0 && bpm < 45;
    const lowSpo2 = spo2 > 0 && spo2 < 90;
    const highBodyTemp = bodyTemp > 38.5;
    const toxicGas = airQuality > 0 && airQuality < 40;
    const lowOxygen = oxygen > 0 && oxygen < 18;
    const highCo = co > 50;
    const obstacle = distance > 0 && distance < 80;

    // Kinematic MEMS Fall Detection Vector Magnitude
    const gMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const fall = (ax !== 0 || ay !== 0 || az !== 0) && (
        Math.abs(ax) > 15 ||
        Math.abs(ay) > 15 ||
        Math.abs(az) > 20 ||
        gMagnitude > 22
    );

    return {
        highBpm,
        lowBpm,
        lowSpo2,
        highBodyTemp,
        toxicGas,
        lowOxygen,
        fall,
        obstacle,
        highCo
    };
}

export function computeSystemSeverity(alerts: TelemetryAlerts, isWristbandOffline = false): SystemSeverity {
    if (
        alerts.fall ||
        alerts.lowSpo2 ||
        alerts.highCo ||
        alerts.lowOxygen ||
        alerts.highBpm ||
        alerts.lowBpm ||
        alerts.highBodyTemp
    ) {
        return 'CRITICAL';
    }

    if (alerts.obstacle || alerts.toxicGas || isWristbandOffline) {
        return 'WARNING';
    }

    return 'NORMAL';
}

export function generateAlertLogs(record: ProcessedTelemetry): AlertLogItem[] {
    const logs: AlertLogItem[] = [];
    const ts = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (record.alerts.fall) {
        logs.push({
            id: `fall-${record.timestamp}`,
            type: 'CRITICAL FALL / IMPACT DETECTED',
            parameter: 'Acceleration',
            value: `[ax:${record.ax}, ay:${record.ay}, az:${record.az}]`,
            severity: 'CRITICAL',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.lowSpo2) {
        logs.push({
            id: `spo2-${record.timestamp}`,
            type: 'HYPOXIA WARNING (LOW SPO2)',
            parameter: 'SpO2',
            value: `${record.spo2}%`,
            severity: 'CRITICAL',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.highCo) {
        logs.push({
            id: `co-${record.timestamp}`,
            type: 'CARBON MONOXIDE HAZARD',
            parameter: 'CO Level',
            value: `${record.co.toFixed(1)} ppm`,
            severity: 'CRITICAL',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.lowOxygen) {
        logs.push({
            id: `o2-${record.timestamp}`,
            type: 'OXYGEN DEPLETION HAZARD',
            parameter: 'Oxygen Env',
            value: `${record.oxygen.toFixed(1)}%`,
            severity: 'CRITICAL',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.highBpm) {
        logs.push({
            id: `bpm_hi-${record.timestamp}`,
            type: 'TACHYCARDIA (ELEVATED HEART RATE)',
            parameter: 'Heart Rate',
            value: `${record.bpm.toFixed(1)} BPM`,
            severity: 'CRITICAL',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.lowBpm) {
        logs.push({
            id: `bpm_lo-${record.timestamp}`,
            type: 'BRADYCARDIA (LOW HEART RATE)',
            parameter: 'Heart Rate',
            value: `${record.bpm.toFixed(1)} BPM`,
            severity: 'CRITICAL',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.highBodyTemp) {
        logs.push({
            id: `btemp-${record.timestamp}`,
            type: 'HEATSTROKE / HYPERTHERMIA',
            parameter: 'Body Temp',
            value: `${record.bodyTemp.toFixed(1)} °C`,
            severity: 'CRITICAL',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.obstacle) {
        logs.push({
            id: `obst-${record.timestamp}`,
            type: 'PROXIMITY OBSTACLE HAZARD',
            parameter: 'Distance',
            value: `${record.distance} cm`,
            severity: 'WARNING',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    if (record.alerts.toxicGas) {
        logs.push({
            id: `gas-${record.timestamp}`,
            type: 'TOXIC GAS CONCENTRATION',
            parameter: 'Air Quality',
            value: `${record.airQuality} AQI`,
            severity: 'WARNING',
            timestamp: ts,
            status: 'ACTIVE'
        });
    }

    return logs;
}
