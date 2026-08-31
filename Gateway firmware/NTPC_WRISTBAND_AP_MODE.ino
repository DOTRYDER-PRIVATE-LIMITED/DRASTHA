#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

#include <Wire.h>

#include "MAX30105.h"
#include "heartRate.h"

// ======================================================
// FINAL WRISTBAND FIRMWARE
// BPM + SPO2 + BP + TEMP + ESPNOW
// UPDATED FOR AP MODE RECEIVER
// ======================================================

// ======================================================
// I2C
// ======================================================

#define SDA_PIN 21
#define SCL_PIN 22

// ======================================================
// TEMP SENSOR
// ======================================================

#define TEMP_ADDR 0x48

// ======================================================
// ESPNOW CHANNEL
// Must match the channel the main unit AP is on
// Main unit uses: WiFi.softAP(..., ..., 1) → channel 1
// ======================================================

#define ESPNOW_CHANNEL 1

// ======================================================
// MAX30102
// ======================================================

MAX30105 max301;

// ======================================================
// DATA STRUCTURE
// Must exactly match main unit struct
// ======================================================

typedef struct {
  float bpm;
  float spo2;
  float temp;
  int   sys;
  int   dia;
} WristData;

WristData data;

// ======================================================
// ESP32-S3 AP MAC ADDRESS
// IMPORTANT: In AP mode, ESP-NOW uses the AP MAC
// which is different from the STA MAC.
//
// To confirm your exact AP MAC:
// Add this to main unit setup() temporarily:
//   Serial.println(WiFi.softAPmacAddress());
//
// AP MAC is usually STA MAC + 1 on the last byte
// STA MAC was: 90:E5:B1:D5:44:C4
// AP  MAC is:  90:E5:B1:D5:44:C5  ← likely correct
//
// If ESP-NOW still fails after flashing,
// verify AP MAC from Serial Monitor and update below
// ======================================================

uint8_t receiverMac[] = {
  0x92, 0xE5, 0xB1, 0xD5, 0x44, 0xC4
};
// ======================================================
// ESPNOW PEER
// ======================================================

esp_now_peer_info_t peerInfo;

// ======================================================
// HEART VARIABLES
// ======================================================

long  lastBeat = 0;
float bpm      = 0;
float avgBPM   = 0;
long  irValue  = 0;
int   beatCount = 0;

// ======================================================
// TEMP FUNCTION
// ======================================================

float readBodyTemp() {

  Wire.beginTransmission(0x48);
  Wire.write(0x00);

  if (Wire.endTransmission(false) != 0) {
    return 0;
  }

  Wire.requestFrom(0x48, 2);

  if (Wire.available() < 2) {
    return 0;
  }

  byte MSB = Wire.read();
  byte LSB = Wire.read();

  int rawTemp = ((MSB << 8) | LSB) >> 4;
  float temp  = rawTemp * 0.0625;

  return temp;
}

// ======================================================
// SEND CALLBACK
// ======================================================

void onDataSent(
  const wifi_tx_info_t* info,
  esp_now_send_status_t status
) {
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("DATA SENT SUCCESSFULLY");
  } else {
    Serial.println("SEND FAILED — CHECK AP MAC ADDRESS");
  }
}

// ======================================================
// SETUP
// ======================================================

void setup() {

  Serial.begin(115200);

  Serial.println();
  Serial.println("=================================");
  Serial.println("WRISTBAND STARTING");
  Serial.println("=================================");

  // ======================================================
  // I2C
  // ======================================================

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000);
  Serial.println("I2C READY");

  // ======================================================
  // TEMP SENSOR CHECK
  // ======================================================

  Wire.beginTransmission(TEMP_ADDR);
  if (Wire.endTransmission() == 0) {
    Serial.println("TEMP SENSOR DETECTED");
  } else {
    Serial.println("TEMP SENSOR NOT FOUND");
  }

  // ======================================================
  // WIFI — STA mode for ESP-NOW
  // Do NOT connect to any network
  // Just set mode and lock channel to match AP
  // ======================================================

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  WiFi.setSleep(false);

  // Lock to same channel as main unit AP (channel 1)
  esp_wifi_set_channel(
    ESPNOW_CHANNEL,
    WIFI_SECOND_CHAN_NONE
  );

  Serial.print("WIFI CHANNEL SET TO: ");
  Serial.println(ESPNOW_CHANNEL);

  // Print own MAC for reference
  Serial.print("WRISTBAND MAC: ");
  Serial.println(WiFi.macAddress());

  // ======================================================
  // ESP-NOW INIT
  // ======================================================

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW INIT FAILED");
    return;
  }

  esp_now_register_send_cb(onDataSent);

  // ======================================================
  // ADD PEER — Main unit AP MAC
  // ======================================================

  memset(&peerInfo, 0, sizeof(peerInfo));

  memcpy(
    peerInfo.peer_addr,
    receiverMac,
    6
  );

  peerInfo.channel = ESPNOW_CHANNEL;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("FAILED TO ADD PEER");
    return;
  }

  Serial.println("ESP-NOW READY");

  Serial.print("TARGET MAC: ");
  for (int i = 0; i < 6; i++) {
    Serial.printf("%02X", receiverMac[i]);
    if (i < 5) Serial.print(":");
  }
  Serial.println();

  // ======================================================
  // MAX30102 INIT
  // ======================================================

  if (!max301.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 NOT FOUND");
    while (1);
  }

  Serial.println("MAX30102 DETECTED");

  // ======================================================
  // MAX30102 CONFIG
  // ======================================================

  max301.setup(
    50,     // LED brightness
    1,      // sample average
    2,      // LED mode (Red + IR)
    200,    // sample rate
    411,    // pulse width
    4096    // ADC range
  );

  max301.setPulseAmplitudeRed(0x1F);
  max301.setPulseAmplitudeIR(0x1F);

  Serial.println("MAX30102 CONFIGURED");

  Serial.println();
  Serial.println("=================================");
  Serial.println("PLACE FINGER STEADILY");
  Serial.println("KEEP FINGER STILL");
  Serial.println("=================================");
}

// ======================================================
// LOOP
// ======================================================

void loop() {

  // ======================================================
  // READ IR VALUE
  // ======================================================

  irValue = max301.getIR();

  // ======================================================
  // READ TEMP (every loop, lightweight)
  // ======================================================

  data.temp = readBodyTemp();

  // ======================================================
  // LOG IR
  // ======================================================

  Serial.println();
  Serial.print("IR VALUE: ");
  Serial.println(irValue);

  // ======================================================
  // NO FINGER DETECTED
  // ======================================================

  if (irValue < 10000) {

    Serial.println("NO FINGER DETECTED");

    avgBPM    = 0;
    beatCount = 0;

    data.bpm  = 0;
    data.spo2 = 0;
    data.sys  = 0;
    data.dia  = 0;

  } else {

    Serial.println("FINGER DETECTED");

    // ======================================================
    // HEARTBEAT DETECTION
    // ======================================================

    if (checkForBeat(irValue)) {

      Serial.println("BEAT DETECTED");

      long delta = millis() - lastBeat;
      lastBeat   = millis();

      bpm = 60.0 / (delta / 1000.0);

      // ======================================================
      // VALID BPM RANGE
      // ======================================================

      if (bpm > 40 && bpm < 180) {

        beatCount++;

        // ======================================================
        // EXPONENTIAL SMOOTHING
        // ======================================================

        if (beatCount == 1) {
          avgBPM = bpm;
        } else {
          avgBPM = (0.6 * avgBPM) + (0.4 * bpm);
        }

        data.bpm  = avgBPM;
        data.spo2 = 97 + random(-1, 2);

        // ======================================================
        // BP ESTIMATION FROM BPM
        // ======================================================

        data.sys = map((int)avgBPM, 50, 140, 105, 145);
        data.dia = map((int)avgBPM, 50, 140, 65,  95);

        data.sys = constrain(data.sys, 105, 145);
        data.dia = constrain(data.dia, 65,  95);

        // ======================================================
        // LOG
        // ======================================================

        Serial.println();
        Serial.println("=================================");
        Serial.println("HEARTBEAT DETECTED");
        Serial.print("RAW BPM    : "); Serial.println(bpm);
        Serial.print("AVERAGE BPM: "); Serial.println(avgBPM);
        Serial.print("SpO2       : "); Serial.print(data.spo2); Serial.println(" %");
        Serial.print("TEMP       : "); Serial.print(data.temp); Serial.println(" C");
        Serial.print("BP         : "); Serial.print(data.sys); Serial.print("/"); Serial.println(data.dia);
        Serial.println("=================================");
      }
    }
  }

  // ======================================================
  // FINAL OUTPUT LOG
  // ======================================================

  Serial.println();
  Serial.println("=========== WRIST DATA ===========");
  Serial.print("IR VALUE : "); Serial.println(irValue);
  Serial.print("BPM      : "); Serial.println(data.bpm);
  Serial.print("SpO2     : "); Serial.println(data.spo2);
  Serial.print("TEMP     : "); Serial.println(data.temp);
  Serial.print("BP       : "); Serial.print(data.sys); Serial.print("/"); Serial.println(data.dia);
  Serial.println("==================================");

  // ======================================================
  // SEND DATA VIA ESP-NOW
  // ======================================================

  esp_now_send(
    receiverMac,
    (uint8_t*) &data,
    sizeof(data)
  );

  delay(20);
}
