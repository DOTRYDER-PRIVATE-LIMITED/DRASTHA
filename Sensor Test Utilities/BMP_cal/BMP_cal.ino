#include <Wire.h>
#include <Adafruit_BMP3XX.h>

#define SDA_PIN 8
#define SCL_PIN 9

Adafruit_BMP3XX bmp;

void setup() {
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);

  Serial.println("BMP390 init...");

  if (!bmp.begin_I2C(0x77)) {  
    Serial.println("❌ BMP390 not detected!");
    while (1);
  }

  // Recommended settings
  bmp.setTemperatureOversampling(BMP3_OVERSAMPLING_8X);
  bmp.setPressureOversampling(BMP3_OVERSAMPLING_4X);
  bmp.setIIRFilterCoeff(BMP3_IIR_FILTER_COEFF_3);

  Serial.println("✅ BMP390 Ready");
}

void loop() {
  if (!bmp.performReading()) {
    Serial.println("❌ Reading failed");
    return;
  }

  Serial.print("Temp: ");
  Serial.print(bmp.temperature);
  Serial.print(" °C | Pressure: ");
  Serial.print(bmp.pressure / 100.0);
  Serial.print(" hPa | Altitude: ");
  Serial.print(bmp.readAltitude(1013.25));
  Serial.println(" m");

  delay(1000);
}