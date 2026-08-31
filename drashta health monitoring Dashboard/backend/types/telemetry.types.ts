export interface RawTelemetryPayload {
    bpm?: number | string;
    pulse?: number | string;
    heart_rate?: number | string;
    
    spo2?: number | string;
    o2?: number | string;
    ox?: number | string;
    
    body?: number | string;
    bodyTemp?: number | string;
    body_temp?: number | string;
    temp_body?: number | string;
    
    bp_sys?: number | string;
    sys?: number | string;
    systolic?: number | string;
    
    bp_dia?: number | string;
    dia?: number | string;
    diastolic?: number | string;
    
    temp?: number | string;
    ambientTemp?: number | string;
    ambient_temp?: number | string;
    temperature?: number | string;
    
    pressure?: number | string;
    press?: number | string;
    baro?: number | string;
    
    alt?: number | string;
    altitude?: number | string;
    
    dist?: number | string;
    distance?: number | string;
    sonar?: number | string;
    obstacle?: number | string;
    
    gas?: number | string;
    mq?: number | string;
    airQuality?: number | string;
    air_quality?: number | string;
    aqi?: number | string;
    
    oxygen?: number | string;
    oxygen_env?: number | string;
    
    co?: number | string;
    co_level?: number | string;
    carbon_monoxide?: number | string;
    
    weight?: number | string;
    load?: number | string;
    strainLoad?: number | string;
    strain?: number | string;
    
    ax?: number | string;
    ay?: number | string;
    az?: number | string;
    
    lat?: number | string;
    latitude?: number | string;
    
    lng?: number | string;
    lon?: number | string;
    longitude?: number | string;
    
    digital_sensor?: number | string | boolean;
    digital?: number | string | boolean;
    digi?: number | string | boolean;
    
    timestamp?: string;
    device_id?: string;
    worker_id?: string;
    [key: string]: any;
}

export interface TelemetryAlerts {
    highBpm: boolean;
    lowBpm: boolean;
    lowSpo2: boolean;
    highBodyTemp: boolean;
    toxicGas: boolean;
    lowOxygen: boolean;
    fall: boolean;
    obstacle: boolean;
    highCo: boolean;
}

export interface ProcessedTelemetry {
    bpm: number;
    spo2: number;
    bodyTemp: number;
    bp_sys: number;
    bp_dia: number;
    ambientTemp: number;
    pressure: number;
    altitude: number;
    distance: number;
    ax: number;
    ay: number;
    az: number;
    airQuality: number;
    oxygen: number;
    co: number;
    strainLoad: number;
    lat: number;
    lng: number;
    digital_sensor?: number;
    alerts: TelemetryAlerts;
    timestamp: string;
    device_id?: string;
    worker_id?: string;
}

export interface AlertLogItem {
    id: string;
    type: string;
    parameter: string;
    value: string;
    severity: 'WARNING' | 'CRITICAL';
    timestamp: string;
    status: 'ACTIVE' | 'RESOLVED';
}

export type SystemSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';
