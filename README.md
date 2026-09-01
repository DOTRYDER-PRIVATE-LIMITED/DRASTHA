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

```text
                    WORKER SAFETY WRISTBAND
                              |
                         ESP-NOW
                              |
                              v
                    SAFETY SENSOR BOX
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
   Wristband Data       Local Sensor Data      GPS Data
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                    UNIFIED TELEMETRY PACKET
                              |
                              v
                       WI-FI / HTTP
                              |
                              v
                       DRASHTA BACKEND

<img width="1774" height="887" alt="data packets" src="https://github.com/user-attachments/assets/f8c28194-980c-41af-b596-e41dc5f26c13" />
