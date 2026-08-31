#include <Wire.h>

#define SDA_PIN 8
#define SCL_PIN 9
#define IMU_ADDR 0x6A

void writeReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(reg);
  Wire.write(val);
  Wire.endTransmission();
}

uint8_t readReg(uint8_t reg) {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(reg);
  Wire.endTransmission(false);
  Wire.requestFrom(IMU_ADDR, 1);
  return Wire.available() ? Wire.read() : 0;
}

int16_t read16(uint8_t reg) {
  Wire.beginTransmission(IMU_ADDR);
  Wire.write(reg | 0x80);
  Wire.endTransmission(false);
  Wire.requestFrom(IMU_ADDR, 2);
  if (Wire.available() < 2) return 0;
  return Wire.read() | (Wire.read() << 8);
}

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(200);

  Serial.println("Init IMU...");

  // 🔥 Reset
  writeReg(0x12, 0x01);
  delay(200);

  // 🔥 Enable Block Data Update (important!)
  writeReg(0x12, 0x44);

  // 🔥 Enable accelerometer: 104Hz, ±2g
  writeReg(0x10, 0x40);

  // 🔥 Enable gyro: 104Hz, 250 dps
  writeReg(0x11, 0x40);

  delay(100);

  // Debug: check registers
  Serial.print("CTRL1_XL: ");
  Serial.println(readReg(0x10), HEX);

  Serial.print("CTRL2_G: ");
  Serial.println(readReg(0x11), HEX);

  Serial.println("IMU READY");
}

void loop() {
  int16_t ax = read16(0x28);
  int16_t ay = read16(0x2A);
  int16_t az = read16(0x2C);

  int16_t gx = read16(0x22);
  int16_t gy = read16(0x24);
  int16_t gz = read16(0x26);

  Serial.print("ACC: ");
  Serial.print(ax); Serial.print(" ");
  Serial.print(ay); Serial.print(" ");
  Serial.print(az);

  Serial.print(" | GYRO: ");
  Serial.print(gx); Serial.print(" ");
  Serial.print(gy); Serial.print(" ");
  Serial.println(gz);

  delay(300);
}