# DRASHTA Industrial IoT Worker Safety & Environmental Hazard Monitoring System

DRASHTA is a distributed Industrial IoT safety monitoring system designed for real-time monitoring of worker physiological parameters, environmental conditions, physical hazards, and equipment-related safety conditions.

The system consists of an ESP32-based Worker Safety Wristband, an ESP32/ESP32-S3-based Safety Sensor Box, a TypeScript/Express backend, a React monitoring dashboard, and a PostgreSQL database managed through Supabase.

---

# 1. Hardware Architecture

DRASHTA follows a distributed **wearable satellite → gateway → backend** architecture.

The hardware system consists of two primary embedded units:

- **Worker Safety Wristband** — wearable physiological monitoring node.
- **Safety Sensor Box** — central sensor aggregation and gateway unit.

The Worker Safety Wristband communicates with the Safety Sensor Box using **ESP-NOW**. The Safety Sensor Box aggregates the wristband telemetry with its locally connected sensor measurements and transmits the unified telemetry data to the DRASHTA backend through Wi-Fi/HTTP.

> **Hardware communication hierarchy:**
><img width="1693" height="929" alt="hardware arch" src="https://github.com/user-attachments/assets/f871d1ba-50d7-4de9-ac13-3a4fda60b1ab" />


---

## 1.1 Worker Safety Wristband

The Worker Safety Wristband is a lightweight wearable sensing node designed to monitor worker-specific physiological parameters and transmit the collected telemetry to the Safety Sensor Box.

### Controller

- **ESP32-based microcontroller**

The ESP32 performs local sensor acquisition, processing, telemetry packet formation, and wireless transmission.

### Integrated Sensors

#### MAX30102 — Heart Rate and SpO₂

The MAX30102 optical sensor is used for physiological monitoring.

It provides:

- Heart Rate (BPM)
- SpO₂ / Blood Oxygen Saturation (%)

The ESP32 processes the sensor readings and includes the resulting physiological measurements in the ESP-NOW telemetry packet.

#### MAX30205 — Body Temperature

The MAX30205 temperature sensor is used for contact-based body-temperature monitoring.

It provides:

- Body Temperature (°C)

The measured body temperature is included in the worker telemetry transmitted to the Safety Sensor Box.

### Communication

The Worker Safety Wristband communicates with the Safety Sensor Box using:

- **ESP-NOW**
- 2.4 GHz wireless peer-to-peer communication
- No direct backend or Internet connection

### Primary Functions

- Real-time heart-rate acquisition
- SpO₂ acquisition
- Body-temperature acquisition
- Local sensor data processing
- Telemetry packet formation
- ESP-NOW wireless transmission
- Transmission of worker physiological data to the Safety Sensor Box

The wristband does **not** directly communicate with the DRASHTA backend, PostgreSQL, Supabase, or the Internet. The Safety Sensor Box is responsible for receiving and forwarding the wearable telemetry.

---

## 1.2 Safety Sensor Box / Main Gateway

The Safety Sensor Box is the central hardware aggregation and gateway unit of DRASHTA.

It performs three primary functions:

1. Receives worker physiological telemetry from the wristband through ESP-NOW.
2. Acquires environmental, atmospheric, gas, oxygen, mechanical, motion/proximity, and GPS measurements from locally connected sensors.
3. Aggregates all available measurements into a unified telemetry packet and transmits the data to the DRASHTA backend through Wi-Fi/HTTP.

### Main Controller

- **ESP32 / ESP32-S3-based gateway controller**

The gateway controller manages sensor acquisition, ESP-NOW reception, telemetry aggregation, packet formation, and Wi-Fi communication with the backend.

---

## 1.2.1 Environmental Monitoring

### BMP280 — Ambient Temperature, Pressure and Altitude

The BMP280 provides environmental and atmospheric measurements.

It provides:

- Ambient Temperature (°C)
- Atmospheric Pressure (hPa)
- Barometric Altitude (m)

The ESP32 reads these measurements and incorporates them into the unified telemetry payload.

---

## 1.2.2 Gas and Air-Quality Monitoring

The Safety Sensor Box incorporates multiple MQ-series sensors for atmospheric and gas-condition monitoring.

### MQ-2 — General Gas Monitoring

The MQ-2 is used for general gas and combustible-gas detection.

It contributes to the system's gas-hazard monitoring data.

### MQ-7 — Carbon Monoxide Monitoring

The MQ-7 is used for Carbon Monoxide (CO) monitoring.

It provides:

- Carbon Monoxide level
- CO concentration data

The CO measurement is transmitted to the backend for safety-condition evaluation.

### MQ-135 — Air Quality Monitoring

The MQ-135 is used for general air-quality and atmospheric contamination monitoring.

It contributes to:

- Air Quality Index (AQI)
- General atmospheric air-quality measurements

The combined gas measurements allow the DRASHTA system to monitor potentially hazardous atmospheric conditions.

---

## 1.2.3 Ambient Oxygen Monitoring

The Safety Sensor Box incorporates an ambient oxygen sensor for monitoring the oxygen concentration of the surrounding environment.

It provides:

- Ambient Oxygen (O₂) percentage

The measurement is included in the telemetry stream and evaluated by the backend safety rules engine for low-oxygen and suffocation-related hazards.

---

## 1.2.4 Mechanical Load / Strain Monitoring

### HX711 + Load Cell

The Safety Sensor Box uses an HX711 load-cell interface together with a load cell / strain sensor for mechanical load measurement.

It provides:

- Mechanical load
- Strain/load measurement
- Load value in kilograms (kg)

The HX711 performs the load-cell signal acquisition while the ESP32 processes the resulting measurement.

The load measurement is incorporated into the unified telemetry payload and can be evaluated against configured safety limits.

---

## 1.2.5 Motion and Proximity Monitoring

The Safety Sensor Box architecture includes motion and proximity sensing for physical hazard detection.

### Motion / IMU Monitoring

The motion-sensing subsystem provides acceleration measurements used for:

- Motion monitoring
- Sudden movement detection
- Impact detection
- Kinematic analysis
- Fall-event evaluation

The telemetry model contains three-axis acceleration measurements:

- `ax`
- `ay`
- `az`

The backend can calculate the resultant acceleration magnitude from these measurements for kinematic safety analysis.

### Proximity Monitoring

The proximity sensor measures the distance between the monitored system and nearby obstacles or hazardous objects.

It provides:

- Obstacle distance (cm)
- Proximity measurement

The measurement can be evaluated against configured safety limits to identify potential collision or machinery hazards.

---

## 1.2.6 GPS Positioning

### GPS Module

The Safety Sensor Box includes a GPS module for geographic positioning.

It provides:

- Latitude
- Longitude

GPS information can be associated with telemetry records to provide geographical context for the monitored hardware and worker-safety data.

---

## 1.3 Hardware Data Aggregation

The Safety Sensor Box combines telemetry from two sources.

### Source A — Worker Safety Wristband

Received through ESP-NOW:

- Heart Rate
- SpO₂
- Body Temperature

### Source B — Safety Sensor Box

Acquired locally:

- Ambient Temperature
- Atmospheric Pressure
- Barometric Altitude
- Gas Measurements
- Carbon Monoxide
- Air Quality
- Ambient Oxygen
- Mechanical Load / Strain
- Motion / Acceleration
- Proximity Distance
- GPS Latitude
- GPS Longitude

The gateway combines these measurements into a unified telemetry packet.
<img width="1774" height="887" alt="data packets" src="https://github.com/user-attachments/assets/f8c28194-980c-41af-b596-e41dc5f26c13" />



## 2. Network Communication Architecture

<img width="1693" height="929" alt="network comm" src="https://github.com/user-attachments/assets/83c6bef0-fe9e-4cdb-b3a5-387fc420a505" />


The DRASHTA system uses a multi-layer wireless communication architecture to connect the Worker Safety Wristband, Safety Sensor Box, local monitoring devices, and the DRASHTA backend.

### 2.1 ESP-NOW Communication

The Worker Safety Wristband communicates with the Safety Sensor Box using **ESP-NOW**, a low-latency, connectionless peer-to-peer wireless communication protocol operating over the 2.4 GHz radio.

- **Wristband:** ESP-NOW slave/satellite node
- **Safety Sensor Box:** ESP-NOW master/gateway node
- **Communication:** Peer-to-peer wireless
- **Frequency:** 2.4 GHz
- **Router dependency:** Not required for wristband-to-gateway communication
- **Purpose:** Transmission of wristband telemetry to the Safety Sensor Box
- **Data:** Heart rate, SpO₂, body temperature, timestamp, and device-related information
- **Packet handling:** Reception, validation, parsing, and integration are performed by the gateway

The ESP-NOW link operates independently of the Internet and does not require the wristband to establish a conventional Wi-Fi connection.

### 2.2 Safety Sensor Box as Communication Gateway

The Safety Sensor Box acts as the central communication gateway between the wearable sensing node and the external DRASHTA software infrastructure.

The gateway receives the wristband telemetry through ESP-NOW and combines it with the locally acquired sensor data before generating the unified telemetry payload.

The gateway therefore provides the communication bridge between:

- ESP-NOW wearable communication
- Local Wi-Fi communication
- Backend HTTP/HTTPS communication

### 2.3 Wi-Fi Soft Access Point (SoftAP)

The Safety Sensor Box can operate as a **Wi-Fi Soft Access Point (SoftAP)**. In this mode, the ESP32/ESP32-S3 gateway creates and broadcasts its own local Wi-Fi network.

The SoftAP provides a local wireless communication interface for monitoring, configuration, diagnostics, and gateway access without requiring an external Wi-Fi router or Internet connection.

Key characteristics include:

- Gateway operates as the Wi-Fi Access Point
- Local SSID is broadcast by the Safety Sensor Box
- Connected devices operate as Wi-Fi stations/clients
- DHCP can provide local IP addresses to connected clients
- Gateway exposes its local communication endpoints to connected clients
- Suitable for local monitoring, configuration, testing, and debugging
- Internet connectivity is not required for local SoftAP communication

The SoftAP functionality is separate from the ESP-NOW communication channel. ESP-NOW is used for wristband-to-gateway telemetry transfer, while SoftAP provides conventional Wi-Fi connectivity for local client devices.

### 2.4 Wi-Fi Station Mode and Backend Uplink

For external backend communication, the Safety Sensor Box operates its Wi-Fi interface in **Station (STA) mode** and connects to an available Wi-Fi network.

The gateway then transmits the unified telemetry payload to the DRASHTA backend using HTTP/HTTPS.

The backend telemetry interface is:

```text
POST /api/telemetry
```

## 3. DRASHTA Monitoring Dashboard

The DRASHTA Monitoring Dashboard is a real-time web application built with **React, TypeScript, Vite, Tailwind CSS, and Recharts**. It provides the operator interface for monitoring worker health, environmental conditions, hardware connectivity, safety alerts, and historical telemetry.

<img width="1536" height="1024" alt="dash" src="https://github.com/user-attachments/assets/08fd81d9-82c1-4015-83e3-5a7d0dce6549" />

### 3.1 Dashboard Communication

The dashboard communicates with the DRASHTA backend through REST APIs rather than communicating directly with the PostgreSQL/Supabase database.

The primary communication path is:

**Safety Sensor Box → Backend API → Dashboard**

The dashboard periodically requests the latest processed telemetry and system status from the backend. The backend remains responsible for hardware communication, telemetry parsing, safety-rule processing, and database operations.

Primary dashboard APIs include:

- `GET /api/latest` — Latest normalized telemetry
- `GET /api/history` — Historical telemetry records
- `GET /api/hardware-status` — Safety Sensor Box connectivity/heartbeat
- `GET /api/db-status` — PostgreSQL/Supabase database status
- `GET /api/alerts` — Safety alert information
- `POST /api/clear-history` — Reset active local/session history where supported

The dashboard does not require direct database credentials because all database access is isolated within the backend layer.

### 3.2 Real-Time Monitoring

The dashboard maintains a high-frequency telemetry polling mechanism for near-real-time visualization.

The frontend maintains an in-memory telemetry history buffer to support:

- Real-time metric cards
- Dynamic SVG sparklines
- Historical charts
- Sensor history tables
- Safety-state visualization

The frontend also monitors hardware heartbeat information and reflects the current Safety Sensor Box state through the dashboard status indicators.

### 3.3 Dashboard Features

The interface provides:

- **Worker Safety Monitoring** — Heart rate, SpO₂, body temperature, and related worker telemetry
- **Environmental Monitoring** — Temperature, pressure, altitude, gas/AQI, ambient oxygen, and related measurements
- **Motion & Proximity Monitoring** — Accelerometer/movement and obstacle-distance information
- **Safety Status** — NORMAL, WARNING, and CRITICAL system states
- **Real-Time Alerts** — Timestamped safety events and hazard notifications
- **Historical Analytics** — Recharts-based telemetry trend visualization
- **Telemetry Audit Table** — Chronological sensor records
- **CSV Export** — Exportable telemetry dataset for analysis and reporting
- **Hardware Status** — Safety Sensor Box and wristband connectivity monitoring
- **Database Status** — Live PostgreSQL/Supabase availability indication
- **Simulation Mode** — Controlled safety scenarios for testing alert and visualization workflows

### 3.4 Database Integration

The dashboard does not directly write telemetry into PostgreSQL. Telemetry is first received and processed by the backend, after which the backend persists the normalized records into **PostgreSQL through Supabase**.

The database layer stores the persistent system information required for:

- Telemetry history
- Safety alerts
- Worker/device information
- Historical analysis
- System records


## 4 Hardware Firmware, Sensor Calibration & Dashboard Setup

### 4.1. Hardware Firmware Location

All production firmware is maintained separately from the dashboard application:

```text
DRASHTA/
│
├── Gateway firmware/
│   ├── NTPC_WRISTBAND_AP_MODE.ino
│   └── ntpc_sensor_box.ino
│
├── Sensor Test Utilities/
│   ├── BMP_cal/
│   │   └── BMP_cal.ino
│   ├── VL53L1X_Distance_cal/
│   │   └── VL53L1X_Distance_cal.ino
│   ├── imu_cal/
│   │   └── imu_cal.ino
│   ├── imu_memory_addr_scan/
│   │   └── imu_memory_addr_scan.ino
│   └── spo2_cal/
│       └── spo2_cal.ino
│
└── drashta health monitoring Dashboard/
    └── Dashboard application
```
