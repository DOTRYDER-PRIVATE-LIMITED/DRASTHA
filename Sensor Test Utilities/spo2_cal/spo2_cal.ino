#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 particleSensor;

long lastBeat = 0;
float beatsPerMinute;
float avgBPM;

void setup() {
  Serial.begin(115200);
  Wire.begin(8, 9);  // SDA, SCL

  Serial.println("Initializing sensor...");

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("❌ Sensor not found!");
    while (1);
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeIR(0x0A);

  Serial.println("👉 Place your finger...");
}

void loop() {
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue) == true) {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      avgBPM = 0.8 * avgBPM + 0.2 * beatsPerMinute;
    }

    Serial.print("❤️ BPM: ");
    Serial.println(avgBPM);
  }

  if (irValue < 5000) {
    Serial.println("❌ No finger detected");
  }

  delay(20);
}