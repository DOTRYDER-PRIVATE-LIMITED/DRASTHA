import { RawTelemetryPayload, ProcessedTelemetry } from '../types/telemetry.types.js';
import { evaluateAlerts } from '../rules/alert.rules.js';

export function parseNumeric(val: any, fallback = 0): number {
    if (val === null || val === undefined) return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
}

export function parseTelemetryPayload(
    raw: RawTelemetryPayload | string,
    previousState?: ProcessedTelemetry | null
): ProcessedTelemetry {
    let payload: RawTelemetryPayload = {};

    if (typeof raw === 'string') {
        try {
            payload = JSON.parse(raw);
        } catch {
            // URL search param format fallback: bpm=75&spo2=98
            try {
                const params = new URLSearchParams(raw);
                payload = Object.fromEntries(params.entries());
            } catch {
                payload = {};
            }
        }
    } else if (typeof raw === 'object' && raw !== null) {
        payload = raw;
    }

    // 1. Physiological Vitals (Wristband via ESP-NOW)
    const rawBpm = payload.bpm ?? payload.pulse ?? payload.heart_rate;
    const rawSpo2 = payload.spo2 ?? payload.o2 ?? payload.ox;
    const rawBodyTemp = payload.bodyTemp ?? payload.body_temp ?? payload.body ?? payload.temp_body;
    const rawBpSys = payload.bp_sys ?? payload.sys ?? payload.systolic;
    const rawBpDia = payload.bp_dia ?? payload.dia ?? payload.diastolic;

    // 2. Environmental & Mechanical (ESP32-S3 Sensors)
    const rawAmbient = payload.ambientTemp ?? payload.ambient_temp ?? payload.temp ?? payload.temperature;
    const rawPressure = payload.pressure ?? payload.press ?? payload.baro;
    const rawAlt = payload.altitude ?? payload.alt;
    const rawDist = payload.distance ?? payload.dist ?? payload.sonar ?? payload.obstacle;

    // 3. Atmospheric Gases
    const rawAirQuality = payload.airQuality ?? payload.air_quality ?? payload.aqi ?? payload.gas ?? payload.mq;
    const rawOxygen = payload.oxygen ?? payload.oxygen_env;
    const rawCo = payload.co ?? payload.co_level ?? payload.carbon_monoxide;

    // 4. Structural Load & Kinematics
    const rawStrain = payload.strainLoad ?? payload.strain ?? payload.weight ?? payload.load;
    const rawAx = payload.ax;
    const rawAy = payload.ay;
    const rawAz = payload.az;

    // 5. Positioning & Hardware State
    const rawLat = payload.lat ?? payload.latitude;
    const rawLng = payload.lng ?? payload.lon ?? payload.longitude;
    const rawDigi = payload.digital_sensor ?? payload.digital ?? payload.digi;

    // Packet Fusion: If fields are missing/undefined, retain previous state (unless explicitly sent as 0)
    const bpm = rawBpm !== undefined ? parseNumeric(rawBpm, 0) : (previousState?.bpm ?? 0);
    const spo2 = rawSpo2 !== undefined ? Math.min(100, Math.max(0, parseNumeric(rawSpo2, 0))) : (previousState?.spo2 ?? 0);
    const bodyTemp = rawBodyTemp !== undefined ? parseNumeric(rawBodyTemp, 0) : (previousState?.bodyTemp ?? 0);
    const bp_sys = rawBpSys !== undefined ? Math.round(parseNumeric(rawBpSys, 0)) : (previousState?.bp_sys ?? 0);
    const bp_dia = rawBpDia !== undefined ? Math.round(parseNumeric(rawBpDia, 0)) : (previousState?.bp_dia ?? 0);

    const ambientTemp = rawAmbient !== undefined ? parseNumeric(rawAmbient, 22.0) : (previousState?.ambientTemp ?? 22.0);
    const pressure = rawPressure !== undefined ? parseNumeric(rawPressure, 1013.25) : (previousState?.pressure ?? 1013.25);
    const altitude = rawAlt !== undefined ? parseNumeric(rawAlt, 0) : (previousState?.altitude ?? 0);
    const distance = rawDist !== undefined ? Math.round(parseNumeric(rawDist, 0)) : (previousState?.distance ?? 0);

    const airQuality = rawAirQuality !== undefined ? Math.round(parseNumeric(rawAirQuality, 35)) : (previousState?.airQuality ?? 35);
    const oxygen = rawOxygen !== undefined ? parseNumeric(rawOxygen, 20.9) : (previousState?.oxygen ?? 20.9);
    const co = rawCo !== undefined ? parseNumeric(rawCo, 0) : (previousState?.co ?? 0);

    const strainLoad = rawStrain !== undefined ? parseNumeric(rawStrain, 0) : (previousState?.strainLoad ?? 0);
    const ax = rawAx !== undefined ? parseNumeric(rawAx, 0) : (previousState?.ax ?? 0);
    const ay = rawAy !== undefined ? parseNumeric(rawAy, 0) : (previousState?.ay ?? 0);
    const az = rawAz !== undefined ? parseNumeric(rawAz, 9.81) : (previousState?.az ?? 9.81);

    // Validate GPS Coordinates
    let lat = rawLat !== undefined ? parseNumeric(rawLat, 0) : (previousState?.lat ?? 0);
    let lng = rawLng !== undefined ? parseNumeric(rawLng, 0) : (previousState?.lng ?? 0);
    if (lat < -90 || lat > 90) lat = 0;
    if (lng < -180 || lng > 180) lng = 0;

    const digital_sensor = rawDigi !== undefined ? (rawDigi ? 1 : 0) : (previousState?.digital_sensor ?? 0);
    const timestamp = payload.timestamp || new Date().toISOString();
    const device_id = payload.device_id || 'NTPC_SENSOR_BOX_01';
    const worker_id = payload.worker_id || 'WK-014';

    const intermediate = {
        bpm,
        spo2,
        bodyTemp,
        bp_sys,
        bp_dia,
        ambientTemp,
        pressure,
        altitude,
        distance,
        ax,
        ay,
        az,
        airQuality,
        oxygen,
        co,
        strainLoad,
        lat,
        lng,
        digital_sensor,
        timestamp,
        device_id,
        worker_id
    };

    const alerts = evaluateAlerts(intermediate);

    return {
        ...intermediate,
        alerts
    };
}
