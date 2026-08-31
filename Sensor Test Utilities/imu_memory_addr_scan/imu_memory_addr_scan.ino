#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(8, 9);
  Serial.println("Scanning...");
}

void loop() {
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found: 0x");
      Serial.println(addr, HEX);
    }
  }
  delay(3000);
}