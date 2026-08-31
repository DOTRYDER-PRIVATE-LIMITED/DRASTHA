-- Migration: 001_initial_schema.sql
-- Description: Initial schema for DRASHTA industrial worker safety telemetry

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) UNIQUE NOT NULL,
    device_type VARCHAR(32) NOT NULL DEFAULT 'SENSOR_BOX',
    name VARCHAR(128) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'OFFLINE',
    firmware_version VARCHAR(32) DEFAULT 'v1.0.0-esp32s3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL DEFAULT 'Industrial Operations',
    assigned_device_id VARCHAR(64) REFERENCES devices(device_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id VARCHAR(64) NOT NULL DEFAULT 'NTPC_SENSOR_BOX_01',
    worker_id VARCHAR(32) DEFAULT 'WK-014',
    bpm NUMERIC(6, 2) DEFAULT 0.00,
    spo2 NUMERIC(5, 2) DEFAULT 0.00,
    body_temp NUMERIC(5, 2) DEFAULT 0.00,
    bp_sys INTEGER DEFAULT 0,
    bp_dia INTEGER DEFAULT 0,
    ambient_temp NUMERIC(5, 2) DEFAULT 0.00,
    pressure NUMERIC(7, 2) DEFAULT 1013.25,
    altitude NUMERIC(6, 2) DEFAULT 0.00,
    distance NUMERIC(6, 2) DEFAULT 0.00,
    air_quality INTEGER DEFAULT 0,
    oxygen_env NUMERIC(5, 2) DEFAULT 20.90,
    co NUMERIC(7, 2) DEFAULT 0.00,
    strain_load NUMERIC(6, 2) DEFAULT 0.00,
    ax NUMERIC(6, 2) DEFAULT 0.00,
    ay NUMERIC(6, 2) DEFAULT 0.00,
    az NUMERIC(6, 2) DEFAULT 9.81,
    latitude NUMERIC(10, 6) DEFAULT 0.000000,
    longitude NUMERIC(10, 6) DEFAULT 0.000000,
    digital_sensor SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id VARCHAR(64) NOT NULL DEFAULT 'NTPC_SENSOR_BOX_01',
    worker_id VARCHAR(32) DEFAULT 'WK-014',
    alert_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('WARNING', 'CRITICAL')),
    parameter VARCHAR(32) NOT NULL,
    value VARCHAR(64) NOT NULL,
    threshold VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS device_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id VARCHAR(64) NOT NULL,
    worker_id VARCHAR(32),
    event_type VARCHAR(64) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_telemetry (
    id BIGSERIAL PRIMARY KEY,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id VARCHAR(64) DEFAULT 'NTPC_SENSOR_BOX_01',
    source VARCHAR(32) DEFAULT 'HTTP_POST',
    raw_payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_timestamp ON telemetry(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_worker_timestamp ON telemetry(worker_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_device_timestamp ON alerts(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_worker_timestamp ON alerts(worker_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_workers_worker_code ON workers(worker_code);
