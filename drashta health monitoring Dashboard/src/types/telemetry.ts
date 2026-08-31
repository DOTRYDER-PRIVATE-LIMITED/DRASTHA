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

export interface TelemetryData {
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
  parameter?: string;
  value: string;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
  status?: 'ACTIVE' | 'RESOLVED';
}

export type ConnectionMode = 'auto' | 'proxy' | 'direct' | 'cloud';

export type SystemSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface DatabaseStatus {
  connected: boolean;
  provider: 'supabase' | 'in_memory_fallback';
  url?: string;
  lastError?: string | null;
  timestamp: string;
}
