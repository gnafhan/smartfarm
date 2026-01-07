# 🔌 Hardware Implementation Guide

Panduan implementasi hardware untuk Sistem Pemantauan Ternak IoT menggunakan ESP32, Arduino, dan mikrokontroler lainnya.

## 📋 Daftar Isi

- [Overview](#overview)
- [Hardware Requirements](#hardware-requirements)
- [Wiring Diagrams](#wiring-diagrams)
- [ESP32 Gas Sensor](#esp32-gas-sensor)
- [ESP32 RFID Reader](#esp32-rfid-reader)
- [Arduino Implementation](#arduino-implementation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

Dokumentasi ini menyediakan contoh kode untuk mengimplementasikan IoT devices pada hardware sebenarnya:

1. **Gas Sensor Module** - Membaca sensor MQ-4 (Methane), MQ-135 (CO2), MQ-137 (NH3)
2. **RFID Reader Module** - Membaca RFID tags untuk tracking ternak
3. **Device Management** - Auto-registration, heartbeat, error handling

## Hardware Requirements

### Gas Sensor Module

| Komponen | Spesifikasi | Jumlah |
|----------|-------------|--------|
| ESP32 DevKit | ESP32-WROOM-32 | 1 |
| MQ-4 Sensor | Methane Gas Sensor | 1 |
| MQ-135 Sensor | Air Quality Sensor (CO2) | 1 |
| MQ-137 Sensor | Ammonia Gas Sensor | 1 |
| DHT22 | Temperature & Humidity Sensor | 1 |
| Resistor | 10kΩ | 3 |
| Breadboard | - | 1 |
| Jumper Wires | - | 20+ |
| Power Supply | 5V 2A | 1 |

### RFID Reader Module

| Komponen | Spesifikasi | Jumlah |
|----------|-------------|--------|
| ESP32 DevKit | ESP32-WROOM-32 | 1 |
| MFRC522 | RFID Reader Module | 1 |
| RFID Tags | 13.56MHz | 10+ |
| LED | 5mm (Green, Red) | 2 |
| Buzzer | Active Buzzer 5V | 1 |
| Resistor | 220Ω | 2 |
| Breadboard | - | 1 |
| Jumper Wires | - | 15+ |
| Power Supply | 5V 2A | 1 |

## Wiring Diagrams

### Gas Sensor Wiring

```
ESP32 Pin Connections:
- MQ-4 Analog Out    → GPIO 34 (ADC1_CH6)
- MQ-135 Analog Out  → GPIO 35 (ADC1_CH7)
- MQ-137 Analog Out  → GPIO 32 (ADC1_CH4)
- DHT22 Data         → GPIO 4
- VCC (All Sensors)  → 5V
- GND (All Sensors)  → GND
```

### RFID Reader Wiring

```
MFRC522 to ESP32:
- SDA  → GPIO 21
- SCK  → GPIO 18
- MOSI → GPIO 23
- MISO → GPIO 19
- IRQ  → Not connected
- GND  → GND
- RST  → GPIO 22
- 3.3V → 3.3V

LED & Buzzer:
- Green LED (+) → GPIO 25 → 220Ω → GND
- Red LED (+)   → GPIO 26 → 220Ω → GND
- Buzzer (+)    → GPIO 27
- Buzzer (-)    → GND
```

## Library Dependencies

### PlatformIO (Recommended)

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps = 
    knolleary/PubSubClient@^2.8
    adafruit/DHT sensor library@^1.4.4
    adafruit/Adafruit Unified Sensor@^1.1.9
    miguelbalboa/MFRC522@^1.4.10
    bblanchon/ArduinoJson@^6.21.3
```

### Arduino IDE

Install libraries melalui Library Manager:
- PubSubClient by Nick O'Leary
- DHT sensor library by Adafruit
- Adafruit Unified Sensor
- MFRC522 by GithubCommunity
- ArduinoJson by Benoit Blanchon

## Configuration

Buat file `config.h` untuk menyimpan konfigurasi:

```cpp
// config.h
#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// MQTT Configuration
#define MQTT_SERVER "192.168.1.100"  // IP address of MQTT broker
#define MQTT_PORT 1883
#define MQTT_USER ""  // Leave empty if no authentication
#define MQTT_PASSWORD ""

// Device Configuration
#define DEVICE_ID "GAS-001"  // Unique device ID
#define BARN_ID "BARN-001"   // Barn assignment

// Sensor Pins (Gas Sensor)
#define MQ4_PIN 34    // Methane
#define MQ135_PIN 35  // CO2
#define MQ137_PIN 32  // NH3
#define DHT_PIN 4     // Temperature & Humidity

// RFID Pins
#define RFID_SDA_PIN 21
#define RFID_RST_PIN 22
#define RFID_SCK_PIN 18
#define RFID_MOSI_PIN 23
#define RFID_MISO_PIN 19

// LED & Buzzer Pins (RFID Reader)
#define LED_GREEN_PIN 25
#define LED_RED_PIN 26
#define BUZZER_PIN 27

// Timing Configuration
#define READING_INTERVAL 10000    // 10 seconds
#define HEARTBEAT_INTERVAL 30000  // 30 seconds
#define RECONNECT_DELAY 5000      // 5 seconds

#endif
```

## Code Examples

Lihat file-file berikut untuk implementasi lengkap:

- [esp32_gas_sensor.ino](./esp32_gas_sensor.ino) - Gas sensor implementation
- [esp32_rfid_reader.ino](./esp32_rfid_reader.ino) - RFID reader implementation
- [arduino_gas_sensor.ino](./arduino_gas_sensor.ino) - Arduino with Ethernet Shield

## MQTT Topics

### Gas Sensor Topics

```
sensors/gas/{DEVICE_ID}                    - Sensor readings
livestock/devices/{DEVICE_ID}/status       - Device status (online/offline)
livestock/devices/{DEVICE_ID}/heartbeat    - Heartbeat messages
livestock/devices/{DEVICE_ID}/error        - Error messages
```

### RFID Reader Topics

```
livestock/devices/{DEVICE_ID}/status       - Device status
livestock/devices/{DEVICE_ID}/heartbeat    - Heartbeat messages
livestock/devices/{DEVICE_ID}/error        - Error messages
```

## Payload Formats

### Gas Sensor Reading

```json
{
  "sensorId": "GAS-001",
  "barnId": "BARN-001",
  "methanePpm": 350.5,
  "co2Ppm": 1200.3,
  "nh3Ppm": 8.7,
  "temperature": 24.5,
  "humidity": 65.2,
  "timestamp": "2024-01-07T10:30:00Z"
}
```

### Device Status

```json
{
  "status": "online",
  "timestamp": "2024-01-07T10:30:00Z",
  "metadata": {
    "type": "gas_sensor",
    "version": "1.0.0",
    "firmware": "esp32-v1.0.0"
  }
}
```

### Heartbeat

```json
{
  "timestamp": "2024-01-07T10:30:00Z"
}
```

### Error Message

```json
{
  "error": "Sensor read timeout",
  "errorCode": "SENSOR_TIMEOUT",
  "message": "Failed to read MQ-4 sensor",
  "timestamp": "2024-01-07T10:30:00Z",
  "metadata": {
    "type": "gas_sensor"
  }
}
```

## Troubleshooting

### WiFi Connection Issues

```cpp
// Add debug output
Serial.println("Connecting to WiFi...");
Serial.print("SSID: ");
Serial.println(WIFI_SSID);

// Check signal strength
long rssi = WiFi.RSSI();
Serial.print("Signal strength: ");
Serial.println(rssi);
```

### MQTT Connection Issues

```cpp
// Enable MQTT debug
client.setCallback(callback);
Serial.print("MQTT State: ");
Serial.println(client.state());
// -4 : MQTT_CONNECTION_TIMEOUT
// -3 : MQTT_CONNECTION_LOST
// -2 : MQTT_CONNECT_FAILED
// -1 : MQTT_DISCONNECTED
//  0 : MQTT_CONNECTED
```

### Sensor Reading Issues

```cpp
// Check sensor voltage
int rawValue = analogRead(MQ4_PIN);
float voltage = rawValue * (3.3 / 4095.0);
Serial.print("MQ-4 Voltage: ");
Serial.println(voltage);

// Sensor needs warm-up time (2-3 minutes)
delay(180000); // Wait 3 minutes on first boot
```

### RFID Reading Issues

```cpp
// Check SPI connection
byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
Serial.print("MFRC522 Version: 0x");
Serial.println(v, HEX);
// Should return 0x91 or 0x92

// Check antenna gain
mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
```

## Power Consumption

### Gas Sensor Module
- ESP32: ~160mA (WiFi active)
- MQ Sensors: ~150mA each (heating)
- DHT22: ~2.5mA
- **Total**: ~600mA @ 5V

### RFID Reader Module
- ESP32: ~160mA (WiFi active)
- MFRC522: ~26mA (active)
- LEDs: ~20mA each
- Buzzer: ~30mA
- **Total**: ~250mA @ 5V

## Best Practices

1. **Sensor Calibration**: Kalibrasi sensor gas di udara bersih sebelum deployment
2. **Power Supply**: Gunakan power supply yang stabil dengan kapasitas cukup
3. **Enclosure**: Gunakan enclosure yang sesuai untuk lingkungan peternakan
4. **Antenna**: Posisikan antenna WiFi untuk sinyal optimal
5. **Error Handling**: Implementasikan watchdog timer untuk auto-recovery
6. **OTA Updates**: Implementasikan Over-The-Air updates untuk maintenance
7. **Data Validation**: Validasi pembacaan sensor sebelum publish
8. **Reconnection Logic**: Implementasikan auto-reconnect untuk WiFi dan MQTT

## Security Considerations

1. **WiFi Security**: Gunakan WPA2 atau WPA3
2. **MQTT Authentication**: Aktifkan username/password untuk MQTT
3. **TLS/SSL**: Gunakan MQTT over TLS untuk production
4. **Firmware Updates**: Verifikasi signature firmware updates
5. **Credential Storage**: Jangan hardcode credentials, gunakan secure storage

## Next Steps

1. Upload code ke ESP32
2. Monitor Serial output untuk debugging
3. Verify device muncul di frontend dashboard
4. Test sensor readings dan RFID scanning
5. Deploy ke lokasi peternakan

## Support

Untuk pertanyaan dan dukungan:
- GitHub Issues: [repository-url]
- Email: support@livestock-monitoring.com
- Documentation: [docs-url]
