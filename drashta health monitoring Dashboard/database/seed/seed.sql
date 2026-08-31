-- Seed data for default devices and workers

INSERT INTO devices (device_id, device_type, name, status, firmware_version)
VALUES 
    ('NTPC_SENSOR_BOX_01', 'SENSOR_BOX', 'ESP32-S3 Industrial Gateway 01', 'ONLINE', 'v1.0.0-esp32s3'),
    ('NTPC_WRISTBAND_01', 'WRISTBAND', 'Worker Biometric Wristband 01', 'ONLINE', 'v1.0.0-espnow')
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO workers (worker_code, name, department, assigned_device_id)
VALUES 
    ('WK-014', 'Ramesh Kumar (Operator)', 'Thermal Boiler Unit #2', 'NTPC_SENSOR_BOX_01')
ON CONFLICT (worker_code) DO NOTHING;
