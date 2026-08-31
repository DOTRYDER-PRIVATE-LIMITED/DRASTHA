#include <Wire.h>
#include <Adafruit_VL53L1X.h>

#define SDA_PIN 8
#define SCL_PIN 9

Adafruit_VL53L1X vl53 = Adafruit_VL53L1X();

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);

  Serial.println("VL53L1X Init...");

  if (!vl53.begin(0x29, &Wire)) {
    Serial.println("❌ Sensor not detected");
    while (1);
  }

  Serial.println("✅ Sensor detected");

  vl53.startRanging();
}

void loop() {
  if (vl53.dataReady()) {
    int distance = vl53.distance();

    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" mm");

    vl53.clearInterrupt();
  }

  delay(50);
}