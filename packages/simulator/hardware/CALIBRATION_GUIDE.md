# 🎯 Sensor Calibration Guide

Panduan kalibrasi sensor gas untuk hasil pembacaan yang akurat.

## 📋 Daftar Isi

- [Mengapa Kalibrasi Penting](#mengapa-kalibrasi-penting)
- [Persiapan Kalibrasi](#persiapan-kalibrasi)
- [Kalibrasi MQ Sensors](#kalibrasi-mq-sensors)
- [Kalibrasi DHT22](#kalibrasi-dht22)
- [Verifikasi Kalibrasi](#verifikasi-kalibrasi)
- [Maintenance](#maintenance)

## Mengapa Kalibrasi Penting

Sensor gas MQ-series memiliki karakteristik yang berbeda-beda:
- Setiap sensor memiliki resistance baseline (R0) yang unik
- R0 berubah seiring waktu dan kondisi lingkungan
- Kalibrasi yang tepat = pembacaan yang akurat
- Kalibrasi buruk = false alerts atau missed dangers

## Persiapan Kalibrasi

### Kondisi Lingkungan

Kalibrasi harus dilakukan di:
- ✅ Udara bersih (outdoor atau ruangan berventilasi baik)
- ✅ Temperature: 20-25°C
- ✅ Humidity: 50-70%
- ✅ Tidak ada sumber gas (kompor, kendaraan, dll)
- ✅ Tidak ada asap rokok atau parfum

### Waktu Warm-up

Sensor MQ memerlukan warm-up sebelum kalibrasi:
- **Pertama kali**: 24-48 jam continuous power
- **Setelah storage**: 2-3 jam
- **Daily operation**: 2-3 menit

### Tools yang Dibutuhkan

- Multimeter (untuk mengukur voltage)
- Serial monitor (untuk melihat readings)
- Notebook (untuk mencatat nilai)
- Stopwatch (untuk timing)

## Kalibrasi MQ Sensors

### Step 1: Warm-up Sensor

```cpp
void warmupSensors() {
  Serial.println("Warming up sensors...");
  Serial.println("Please wait 3 minutes...");
  
  for (int i = 180; i > 0; i--) {
    Serial.print("Time remaining: ");
    Serial.print(i);
    Serial.println(" seconds");
    delay(1000);
  }
  
  Serial.println("Warm-up complete!");
}
```

### Step 2: Measure R0 (Baseline Resistance)

Upload sketch berikut untuk mengukur R0:

```cpp
#define MQ4_PIN 34
#define RL 10.0  // Load resistance in kΩ (check your module)

void setup() {
  Serial.begin(115200);
  pinMode(MQ4_PIN, INPUT);
  
  // Warm-up
  Serial.println("Warming up... (3 minutes)");
  delay(180000);
  
  Serial.println("\nStarting R0 calibration...");
  Serial.println("Make sure sensor is in CLEAN AIR!");
  Serial.println("Taking 100 samples...\n");
  
  float r0Sum = 0;
  int samples = 100;
  
  for (int i = 0; i < samples; i++) {
    int rawValue = analogRead(MQ4_PIN);
    float voltage = rawValue * (3.3 / 4095.0);
    float rs = ((3.3 * RL) / voltage) - RL;
    
    // For MQ-4 in clean air, Rs/R0 ≈ 4.4
    float r0 = rs / 4.4;
    r0Sum += r0;
    
    Serial.print("Sample ");
    Serial.print(i + 1);
    Serial.print(": R0 = ");
    Serial.println(r0);
    
    delay(500);
  }
  
  float r0Average = r0Sum / samples;
  
  Serial.println("\n=================================");
  Serial.println("CALIBRATION COMPLETE!");
  Serial.print("Average R0: ");
  Serial.println(r0Average);
  Serial.println("=================================");
  Serial.println("\nUpdate your config.h:");
  Serial.print("#define MQ4_R0 ");
  Serial.println(r0Average);
}

void loop() {
  // Empty
}
```

### Step 3: Record R0 Values

Catat nilai R0 untuk setiap sensor:

```
MQ-4 (Methane):   R0 = _____ kΩ
MQ-135 (CO2):     R0 = _____ kΩ
MQ-137 (NH3):     R0 = _____ kΩ
```

### Step 4: Update config.h

```cpp
// Sensor Calibration (Gas Sensors)
#define MQ4_R0 9.83      // Your measured value
#define MQ135_R0 11.47   // Your measured value
#define MQ137_R0 8.92    // Your measured value
```

### Conversion Curves

Setiap sensor memiliki conversion curve yang berbeda:

**MQ-4 (Methane):**
```cpp
float readMQ4() {
  int rawValue = analogRead(MQ4_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  float rs = ((3.3 * RL) / voltage) - RL;
  float ratio = rs / MQ4_R0;
  
  // Curve fitting from datasheet
  // PPM = a * ratio^b
  // For CH4: a = 1000, b = -1.5
  float ppm = 1000.0 * pow(ratio, -1.5);
  
  return ppm;
}
```

**MQ-135 (CO2):**
```cpp
float readMQ135() {
  int rawValue = analogRead(MQ135_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  float rs = ((3.3 * RL) / voltage) - RL;
  float ratio = rs / MQ135_R0;
  
  // For CO2: a = 116.6, b = -2.769
  float ppm = 116.6 * pow(ratio, -2.769);
  
  return ppm;
}
```

**MQ-137 (NH3):**
```cpp
float readMQ137() {
  int rawValue = analogRead(MQ137_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  float rs = ((3.3 * RL) / voltage) - RL;
  float ratio = rs / MQ137_R0;
  
  // For NH3: a = 102.2, b = -2.473
  float ppm = 102.2 * pow(ratio, -2.473);
  
  return ppm;
}
```

## Kalibrasi DHT22

DHT22 biasanya sudah dikalibrasi dari pabrik, tapi bisa diverifikasi:

### Temperature Verification

```cpp
void verifyTemperature() {
  float temp = dht.readTemperature();
  
  // Compare with reference thermometer
  Serial.print("DHT22 Temperature: ");
  Serial.println(temp);
  Serial.println("Compare with reference thermometer");
  
  // If difference > 2°C, sensor may be faulty
}
```

### Humidity Verification

```cpp
void verifyHumidity() {
  float humidity = dht.readHumidity();
  
  // Compare with reference hygrometer
  Serial.print("DHT22 Humidity: ");
  Serial.println(humidity);
  Serial.println("Compare with reference hygrometer");
  
  // If difference > 5%, sensor may be faulty
}
```

## Verifikasi Kalibrasi

### Test dengan Gas Diketahui

Jika memungkinkan, test dengan gas concentration yang diketahui:

```cpp
void testCalibration() {
  Serial.println("Testing calibration...");
  Serial.println("Expose sensor to known gas concentration");
  
  delay(60000); // Wait 1 minute for stabilization
  
  float ppm = readMQ4();
  Serial.print("Measured: ");
  Serial.print(ppm);
  Serial.println(" ppm");
  
  Serial.println("Compare with known concentration");
  Serial.println("Acceptable error: ±10%");
}
```

### Consistency Test

Test konsistensi pembacaan:

```cpp
void consistencyTest() {
  Serial.println("Consistency test (10 readings):");
  
  float readings[10];
  float sum = 0;
  
  for (int i = 0; i < 10; i++) {
    readings[i] = readMQ4();
    sum += readings[i];
    Serial.print("Reading ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(readings[i]);
    delay(1000);
  }
  
  float average = sum / 10;
  float variance = 0;
  
  for (int i = 0; i < 10; i++) {
    variance += pow(readings[i] - average, 2);
  }
  variance /= 10;
  float stdDev = sqrt(variance);
  
  Serial.println("\nResults:");
  Serial.print("Average: ");
  Serial.println(average);
  Serial.print("Std Dev: ");
  Serial.println(stdDev);
  Serial.print("CV: ");
  Serial.print((stdDev / average) * 100);
  Serial.println("%");
  
  if ((stdDev / average) < 0.1) {
    Serial.println("✓ Consistency: GOOD");
  } else {
    Serial.println("✗ Consistency: POOR - Check sensor");
  }
}
```

## Maintenance

### Re-calibration Schedule

- **Initial**: Setelah instalasi
- **Weekly**: Minggu pertama (untuk monitoring drift)
- **Monthly**: Bulan pertama
- **Quarterly**: Setelah stabil
- **Annually**: Maintenance rutin
- **After issues**: Jika ada pembacaan aneh

### Cleaning Sensors

MQ sensors dapat terkontaminasi:

1. **Power off** device
2. **Gentle brush** untuk membersihkan debu
3. **Compressed air** untuk membersihkan debris
4. **Avoid liquids** - jangan gunakan cairan
5. **Re-calibrate** setelah cleaning

### Sensor Lifespan

- MQ Sensors: 2-5 tahun (tergantung usage)
- DHT22: 3-5 tahun
- Signs of aging:
  - Drift yang signifikan
  - Response time lambat
  - Inconsistent readings
  - Physical damage

## Troubleshooting Calibration

### Problem: R0 values tidak stabil

**Causes:**
- Sensor belum warm-up cukup
- Lingkungan tidak bersih
- Power supply tidak stabil
- Sensor rusak

**Solutions:**
- Extend warm-up time
- Move to cleaner environment
- Check power supply
- Replace sensor

### Problem: Readings terlalu tinggi

**Causes:**
- R0 terlalu rendah
- Conversion curve salah
- Sensor terkontaminasi

**Solutions:**
- Re-calibrate R0
- Verify curve parameters
- Clean sensor

### Problem: Readings terlalu rendah

**Causes:**
- R0 terlalu tinggi
- Sensor aging
- Poor connection

**Solutions:**
- Re-calibrate R0
- Check sensor age
- Verify wiring

## Advanced Calibration

### Multi-point Calibration

Untuk akurasi lebih tinggi, gunakan multiple reference points:

```cpp
// Two-point calibration
float calibrateTwoPoint(float raw, 
                        float raw1, float ref1,
                        float raw2, float ref2) {
  // Linear interpolation
  float slope = (ref2 - ref1) / (raw2 - raw1);
  float intercept = ref1 - (slope * raw1);
  return (slope * raw) + intercept;
}
```

### Temperature Compensation

MQ sensors dipengaruhi temperature:

```cpp
float temperatureCompensation(float ppm, float temp) {
  // Typical: -0.5% per °C deviation from 20°C
  float tempFactor = 1.0 - (0.005 * (temp - 20.0));
  return ppm * tempFactor;
}
```

### Humidity Compensation

```cpp
float humidityCompensation(float ppm, float humidity) {
  // Typical: -0.3% per % RH deviation from 65%
  float humidityFactor = 1.0 - (0.003 * (humidity - 65.0));
  return ppm * humidityFactor;
}
```

## Calibration Log Template

Simpan log kalibrasi untuk tracking:

```
CALIBRATION LOG
===============

Date: _______________
Technician: _______________
Device ID: _______________

Environmental Conditions:
- Temperature: _____ °C
- Humidity: _____ %
- Location: _______________

Sensor Readings:
- MQ-4 R0: _____ kΩ
- MQ-135 R0: _____ kΩ
- MQ-137 R0: _____ kΩ

Verification:
- Consistency test: PASS / FAIL
- Reference test: PASS / FAIL

Notes:
_________________________________
_________________________________
_________________________________

Next calibration due: _______________
```

## Resources

- [MQ-4 Datasheet](https://www.pololu.com/file/0J309/MQ4.pdf)
- [MQ-135 Datasheet](https://www.olimex.com/Products/Components/Sensors/Gas/SNS-MQ135/resources/SNS-MQ135.pdf)
- [MQ-137 Datasheet](https://www.sparkfun.com/datasheets/Sensors/Biometric/MQ-137.pdf)
- [DHT22 Datasheet](https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf)

## Support

Untuk bantuan kalibrasi:
- Email: support@livestock-monitoring.com
- Forum: [forum-url]
- Video tutorial: [youtube-url]
