#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

#include <esp_now.h>
#include <esp_wifi.h>

#include <Wire.h>

#include <Adafruit_BMP3XX.h>
#include <Adafruit_VL53L1X.h>
#include <Adafruit_ISM330DHCX.h>

#include "HX711.h"

#include <TinyGPS++.h>

// ======================================================
// NTPC INDUSTRIAL IoT MAIN NODE
// OFFLINE AP MODE — HTTP DATA SERVER
// ESP32-S3 FIRMWARE
// ======================================================

// ======================================================
// WIFI ACCESS POINT CONFIG
// ======================================================

const char* AP_SSID     = "NTPC_SENSOR";
const char* AP_PASSWORD = "12345678";

// ESP-NOW and AP both work on same channel
// AP mode default channel = 1
#define ESPNOW_CHANNEL 1

// ======================================================
// HTTP SERVER
// ======================================================

WebServer server(80);

// ======================================================
// I2C PINS
// ======================================================

#define SDA_PIN 8
#define SCL_PIN 9

// ======================================================
// SENSOR PINS
// ======================================================

#define MQ2_PIN   4
#define HX_DT     5
#define HX_SCK    6
#define GPS_RX    16
#define GPS_TX    17

// ======================================================
// BUZZER
// ======================================================

#define BUZZER_PIN 15

// ======================================================
// MQ7B — CO SENSOR
// ======================================================

#define MQ7B_PIN 14

// ======================================================
// ALERT THRESHOLDS
// ======================================================

#define BPM_HIGH_THRESHOLD    125
#define BPM_LOW_THRESHOLD     40
#define SPO2_LOW_THRESHOLD    90
#define BODY_TEMP_THRESHOLD   40.5
#define AIR_QUALITY_THRESHOLD 40
#define DISTANCE_THRESHOLD    1
#define IMPACT_THRESHOLD      18
#define OXYGEN_THRESHOLD      18.0
#define CO_THRESHOLD          1000    // ppm — OSHA safe limit is 50ppm TWA; 200ppm = danger

// ======================================================
// SENSOR OBJECTS
// ======================================================

Adafruit_BMP3XX      bmp;
Adafruit_VL53L1X     vl53;
Adafruit_ISM330DHCX  imu;
HX711                scale;
TinyGPSPlus          gps;
HardwareSerial       GPSserial(1);

// ======================================================
// WRIST DATA STRUCT
// Must exactly match wristband firmware struct
// ======================================================

typedef struct {
  float bpm;
  float spo2;
  float temp;
  int   sys;
  int   dia;
} WristData;

WristData wrist;

// ======================================================
// GLOBAL SENSOR VALUES
// ======================================================

float  d_temp              = 0;
float  d_pressure          = 0;
float  d_alt               = 0;
int    d_distance          = 0;
float  d_air               = 0;
float  d_oxygen            = 20.9;
double d_lat               = 0;
double d_lng               = 0;
float  d_ax                = 0;
float  d_ay                = 0;
float  d_az                = 0;
float  d_co               = 0;     // CO concentration in ppm (MQ7B)
float  strainLoad          = 0;

// ======================================================
// ALERT FLAGS
// (stored so dashboard can read latest alert state)
// ======================================================

bool alert_high_bpm        = false;
bool alert_low_bpm         = false;
bool alert_low_spo2        = false;
bool alert_high_body_temp  = false;
bool alert_toxic_gas       = false;
bool alert_low_oxygen      = false;
bool alert_fall            = false;
bool alert_obstacle        = false;
bool alert_high_co         = false;

// ======================================================
// LOAD CELL CALIBRATION
// ======================================================

float calibration_factor = -7050.0;

// ======================================================
// ALTITUDE CALIBRATION
// ======================================================

float localPressure = 1008.6;
float baseAltitude  = -9999;   // -9999 = not yet calibrated on startup

// ======================================================
// TIMERS
// ======================================================

unsigned long lastSensor = 0;

// ======================================================
// BUZZER FUNCTION
// Uses tone() — matches confirmed working test code
// tone(pin, frequency, duration) then silence gap
// ======================================================

#define BUZZER_FREQ 1000  // 1 kHz tone

void triggerBuzzer(int count, int onDelay, int offDelay) {
  for (int i = 0; i < count; i++) {
    tone(BUZZER_PIN, BUZZER_FREQ, onDelay);
    delay(onDelay);
    noTone(BUZZER_PIN);
    delay(offDelay);
  }
}

// ======================================================
// ESP-NOW RECEIVE CALLBACK
// ======================================================

void onDataRecv(
  const esp_now_recv_info_t* recv_info,
  const uint8_t* incomingData,
  int len
) {
  memcpy(&wrist, incomingData, sizeof(wrist));

  Serial.println();
  Serial.println("=================================");
  Serial.println("WRIST DATA RECEIVED VIA ESP-NOW");
  Serial.println("=================================");
  Serial.print("BPM      : "); Serial.println(wrist.bpm);
  Serial.print("SpO2     : "); Serial.println(wrist.spo2);
  Serial.print("BODY TEMP: "); Serial.println(wrist.temp);
  Serial.print("BP       : ");
  Serial.print(wrist.sys);
  Serial.print("/");
  Serial.println(wrist.dia);
  Serial.println("=================================");
}

// ======================================================
// HTTP — CORS PREFLIGHT HANDLER
// Required so React on localhost:5173 can fetch data
// ======================================================

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin",  "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

// ======================================================
// HTTP — /data ENDPOINT
// Returns all sensor data as JSON
// ======================================================

void handleData() {

  // ---- Build JSON ----

  StaticJsonDocument<1024> doc;

  // Wristband
  doc["bpm"]      = wrist.bpm;
  doc["spo2"]     = wrist.spo2;
  doc["bodyTemp"] = wrist.temp;
  doc["bp_sys"]   = wrist.sys;
  doc["bp_dia"]   = wrist.dia;

  // BMP390
  doc["ambientTemp"] = d_temp;
  doc["pressure"]    = d_pressure;
  doc["altitude"]    = d_alt;

  // VL53L1X
  doc["distance"] = d_distance;

  // IMU
  doc["ax"] = d_ax;
  doc["ay"] = d_ay;
  doc["az"] = d_az;

  // Gas sensors
  doc["airQuality"] = d_air;
  doc["oxygen"]     = d_oxygen;

  // Load cell
  doc["strainLoad"] = strainLoad;

  // GPS
  doc["lat"] = d_lat;
  doc["lng"] = d_lng;

  // MQ7B — CO
  doc["co"] = d_co;

  // Alert status object
  JsonObject alerts = doc.createNestedObject("alerts");
  alerts["highBpm"]       = alert_high_bpm;
  alerts["lowBpm"]        = alert_low_bpm;
  alerts["lowSpo2"]       = alert_low_spo2;
  alerts["highBodyTemp"]  = alert_high_body_temp;
  alerts["toxicGas"]      = alert_toxic_gas;
  alerts["lowOxygen"]     = alert_low_oxygen;
  alerts["fall"]          = alert_fall;
  alerts["obstacle"]      = alert_obstacle;
  alerts["highCo"]        = alert_high_co;

  String payload;
  serializeJson(doc, payload);

  // ---- Send with CORS headers ----

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Cache-Control", "no-cache");
  server.send(200, "application/json", payload);

  Serial.println("HTTP /data SERVED");
}

// ======================================================
// HTTP — /ping ENDPOINT
// Quick connectivity check for dashboard
// ======================================================

void handlePing() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

// ======================================================
// HTTP — 404
// ======================================================

void handleNotFound() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(404, "text/plain", "Not Found");
}

// ======================================================
// SENSOR SETUP
// ======================================================

void setupSensors() {

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);
  Serial.println("I2C READY");

  // BMP390
  if (bmp.begin_I2C()) {
    Serial.println("BMP390 READY");
  } else {
    Serial.println("BMP390 FAILED");
  }

  // VL53L1X
  if (vl53.begin()) {
    vl53.startRanging();
    Serial.println("VL53L1X READY");
  } else {
    Serial.println("VL53L1X FAILED");
  }

  // IMU
  if (imu.begin_I2C()) {
    Serial.println("IMU READY");
  } else {
    Serial.println("IMU FAILED");
  }

  // HX711
  scale.begin(HX_DT, HX_SCK);
  scale.set_scale(calibration_factor);
  scale.tare();
  Serial.println("HX711 READY — TARE COMPLETE");

  // GPS
  GPSserial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("GPS READY");

  // MQ7B — CO sensor (analog, no pinMode needed for analogRead)
  Serial.println("MQ7B CO SENSOR READY");

  // Oxygen sensor
  Wire.beginTransmission(0x73);
  if (Wire.endTransmission() == 0) {
    Serial.println("OXYGEN SENSOR READY");
  } else {
    Serial.println("OXYGEN SENSOR FAILED");
  }
}

// ======================================================
// SENSOR READ
// ======================================================

void readSensors() {

  // BMP390
  if (bmp.performReading()) {
    d_temp     = bmp.temperature;
    d_pressure = bmp.pressure / 100.0;
    float rawAlt = bmp.readAltitude(localPressure);
    if (baseAltitude == -9999) {
      baseAltitude = rawAlt;
      Serial.print("BASE ALTITUDE CALIBRATED: ");
      Serial.print(baseAltitude);
      Serial.println(" m (sea level)");
    }
    d_alt = rawAlt - baseAltitude;
  }

  // VL53L1X
  if (vl53.dataReady()) {
    d_distance = vl53.distance();
    vl53.clearInterrupt();
  }

  // IMU
  sensors_event_t a, g, t;
  imu.getEvent(&a, &g, &t);
  d_ax = a.acceleration.x;
  d_ay = a.acceleration.y;
  d_az = a.acceleration.z;

  // MQ2 — Air Quality
  int rawGas = analogRead(MQ2_PIN);
  d_air = constrain(map(rawGas, 200, 3000, 100, 0), 0, 100);

  // HX711
  if (scale.is_ready()) {
    strainLoad = scale.get_units(10);
    if (strainLoad < 0) strainLoad = 0;
    Serial.print("STRAIN: ");
    Serial.print(strainLoad);
    Serial.println(" KG");
  }

  // Oxygen sensor (ME2-O2 via I2C 0x73)
  Wire.beginTransmission(0x73);
  Wire.write(0x00);
  if (Wire.endTransmission() == 0) {
    Wire.requestFrom(0x73, 4);
    if (Wire.available() >= 4) {
      uint8_t d[4];
      for (int i = 0; i < 4; i++) d[i] = Wire.read();
      int raw = (d[2] << 8) | d[3];
      float val = raw / 100.0;
      if (val > 10 && val < 25) d_oxygen = val;
    }
  }

  // GPS
  while (GPSserial.available()) {
    gps.encode(GPSserial.read());
  }
  if (gps.location.isValid()) {
    d_lat = gps.location.lat();
    d_lng = gps.location.lng();
  }

  // MQ7B — CO sensor (analog)
  int rawCO = analogRead(MQ7B_PIN);
  // Map raw ADC (0-4095) to ppm range (0-1000 ppm)
  // MQ7B: higher raw value = higher CO concentration
  d_co = map(rawCO, 200, 3500, 0, 1000);
  d_co = constrain(d_co, 0, 1000);
  Serial.print("CO: "); Serial.print(d_co); Serial.println(" ppm");
}

// ======================================================
// SAFETY ALERTS
// ======================================================

void safetyAlerts() {

  // Reset all flags
  alert_high_bpm       = false;
  alert_low_bpm        = false;
  alert_low_spo2       = false;
  alert_high_body_temp = false;
  alert_toxic_gas      = false;
  alert_low_oxygen     = false;
  alert_fall           = false;
  alert_obstacle       = false;
  alert_high_co        = false;

  if (wrist.bpm > BPM_HIGH_THRESHOLD) {
    alert_high_bpm = true;
    Serial.println("ALERT: HIGH BPM");
    triggerBuzzer(3, 200, 150);
  }

  if (wrist.bpm > 1 && wrist.bpm < BPM_LOW_THRESHOLD) {
    alert_low_bpm = true;
    Serial.println("ALERT: LOW BPM");
    triggerBuzzer(2, 500, 250);
  }

  if (wrist.spo2 > 1 && wrist.spo2 < SPO2_LOW_THRESHOLD) {
    alert_low_spo2 = true;
    Serial.println("ALERT: LOW SPO2");
    triggerBuzzer(5, 100, 100);
  }

  if (wrist.temp > BODY_TEMP_THRESHOLD) {
    alert_high_body_temp = true;
    Serial.println("ALERT: HIGH BODY TEMP");
    triggerBuzzer(4, 250, 150);
  }

  if (d_air < AIR_QUALITY_THRESHOLD) {
    alert_toxic_gas = true;
    Serial.println("ALERT: TOXIC GAS");
    triggerBuzzer(6, 120, 120);
  }

  if (d_oxygen < OXYGEN_THRESHOLD) {
    alert_low_oxygen = true;
    Serial.println("ALERT: LOW OXYGEN");
    triggerBuzzer(7, 100, 100);
  }

  if (abs(d_ax) > IMPACT_THRESHOLD ||
      abs(d_ay) > IMPACT_THRESHOLD ||
      abs(d_az) > IMPACT_THRESHOLD) {
    alert_fall = true;
    Serial.println("ALERT: FALL DETECTED");
    triggerBuzzer(8, 80, 80);
  }

  if (d_distance > 0 && d_distance < DISTANCE_THRESHOLD) {
    alert_obstacle = true;
    Serial.println("ALERT: OBSTACLE");
    triggerBuzzer(2, 150, 100);
  }

  if (d_co > CO_THRESHOLD) {
    alert_high_co = true;
    Serial.println("ALERT: HIGH CO LEVEL");
    triggerBuzzer(5, 100, 100);
  }
}

// ======================================================
// SETUP
// ======================================================

void setup() {

  Serial.begin(115200);
  delay(2000);

  Serial.println();
  Serial.println("=================================");
  Serial.println("NTPC MAIN ESP32-S3 STARTING");
  Serial.println("OFFLINE AP MODE");
  Serial.println("=================================");

  // Buzzer — tone() handles pin internally, no pinMode needed
  noTone(BUZZER_PIN);
  Serial.println("BUZZER READY");

  // Sensors
  setupSensors();

  // ======================================================
  // WIFI AP MODE
  // Must start AP before ESP-NOW so channel is fixed
  // ======================================================

  WiFi.mode(WIFI_AP);

  WiFi.softAP(AP_SSID, AP_PASSWORD, ESPNOW_CHANNEL);

  IPAddress apIP = WiFi.softAPIP();

  Serial.println();
  Serial.println("=================================");
  Serial.println("WIFI ACCESS POINT STARTED");
  Serial.print("SSID    : "); Serial.println(AP_SSID);
  Serial.print("PASSWORD: "); Serial.println(AP_PASSWORD);
  Serial.print("IP      : "); Serial.println(apIP);
  Serial.print("CHANNEL : "); Serial.println(ESPNOW_CHANNEL);
  Serial.println("=================================");

  // ======================================================
  // ESP-NOW INIT
  // Channel already fixed by AP mode above (channel 1)
  // Wristband must also be on channel 1
  // ======================================================

  if (esp_now_init() == ESP_OK) {
    esp_now_register_recv_cb(onDataRecv);
    Serial.println("ESP-NOW READY");
  } else {
    Serial.println("ESP-NOW FAILED");
  }

  // ======================================================
  // HTTP SERVER ROUTES
  // ======================================================

  server.on("/data",    HTTP_GET,     handleData);
  server.on("/data",    HTTP_OPTIONS, handleOptions);
  server.on("/ping",    HTTP_GET,     handlePing);
  server.onNotFound(handleNotFound);

  server.begin();

  Serial.println("HTTP SERVER STARTED");
  Serial.println("Dashboard endpoint: http://192.168.4.1/data");

  Serial.println();
  Serial.println("=================================");
  Serial.println("SYSTEM READY");
  Serial.println("Connect to: NTPC_SENSOR");
  Serial.println("Open React app at localhost:5173");
  Serial.println("Fetch data from http://192.168.4.1/data");
  Serial.println("=================================");
}

// ======================================================
// LOOP
// ======================================================

void loop() {

  // Handle incoming HTTP requests
  server.handleClient();

  // Read sensors every 1 second
  if (millis() - lastSensor > 1000) {
    lastSensor = millis();
    readSensors();
    safetyAlerts();
  }
}
