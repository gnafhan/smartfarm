# 🔌 Wiring Guide

Panduan lengkap untuk merakit hardware IoT Livestock Monitoring System.

## 📋 Daftar Isi

- [Gas Sensor Module](#gas-sensor-module)
- [RFID Reader Module](#rfid-reader-module)
- [Power Supply](#power-supply)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Gas Sensor Module

### Komponen yang Dibutuhkan

- ESP32 DevKit (1x)
- MQ-4 Gas Sensor (1x)
- MQ-135 Gas Sensor (1x)
- MQ-137 Gas Sensor (1x)
- DHT22 Temperature & Humidity Sensor (1x)
- Resistor 10kΩ (3x)
- Breadboard (1x)
- Jumper wires (20+)
- Power supply 5V 2A (1x)

### Wiring Diagram

```
ESP32 DevKit Pin Layout:
                    ┌─────────┐
                    │  ESP32  │
                    │ DevKit  │
                    └─────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    │  GPIO 34 ──────────┼──── MQ-4 (A0)     │
    │  GPIO 35 ──────────┼──── MQ-135 (A0)   │
    │  GPIO 32 ──────────┼──── MQ-137 (A0)   │
    │  GPIO 4  ──────────┼──── DHT22 (Data)  │
    │                    │                    │
    │  5V      ──────────┼──── VCC (All)     │
    │  GND     ──────────┼──── GND (All)     │
    └────────────────────┴────────────────────┘
```

### Step-by-Step Wiring

#### 1. MQ-4 Sensor (Methane)

```
MQ-4 Pin    →  ESP32 Pin
─────────────────────────
VCC         →  5V
GND         →  GND
A0 (Analog) →  GPIO 34
D0 (Digital)→  Not connected
```

**Notes:**
- MQ-4 membutuhkan 5V untuk heater
- Output analog 0-5V, ESP32 ADC max 3.3V
- Gunakan voltage divider jika perlu

#### 2. MQ-135 Sensor (CO2)

```
MQ-135 Pin  →  ESP32 Pin
─────────────────────────
VCC         →  5V
GND         →  GND
A0 (Analog) →  GPIO 35
D0 (Digital)→  Not connected
```

#### 3. MQ-137 Sensor (NH3)

```
MQ-137 Pin  →  ESP32 Pin
─────────────────────────
VCC         →  5V
GND         →  GND
A0 (Analog) →  GPIO 32
D0 (Digital)→  Not connected
```

#### 4. DHT22 Sensor

```
DHT22 Pin   →  ESP32 Pin
─────────────────────────
VCC (+)     →  3.3V or 5V
GND (-)     →  GND
Data        →  GPIO 4
```

**Notes:**
- Tambahkan pull-up resistor 10kΩ antara Data dan VCC
- DHT22 bisa menggunakan 3.3V atau 5V

### Voltage Divider (Optional)

Jika sensor output 5V dan ESP32 ADC max 3.3V:

```
Sensor A0 ──┬── 10kΩ ──┬── ESP32 GPIO
            │          │
           GND       10kΩ
                      │
                     GND

Output voltage = 5V × (10kΩ / (10kΩ + 10kΩ)) = 2.5V
```

## RFID Reader Module

### Komponen yang Dibutuhkan

- ESP32 DevKit (1x)
- MFRC522 RFID Reader (1x)
- RFID Tags 13.56MHz (10+)
- LED Green 5mm (1x)
- LED Red 5mm (1x)
- Active Buzzer 5V (1x)
- Resistor 220Ω (2x)
- Breadboard (1x)
- Jumper wires (15+)
- Power supply 5V 2A (1x)

### Wiring Diagram

```
                    ┌─────────┐
                    │  ESP32  │
                    │ DevKit  │
                    └─────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    │  GPIO 21 ──────────┼──── MFRC522 SDA   │
    │  GPIO 22 ──────────┼──── MFRC522 RST   │
    │  GPIO 18 ──────────┼──── MFRC522 SCK   │
    │  GPIO 23 ──────────┼──── MFRC522 MOSI  │
    │  GPIO 19 ──────────┼──── MFRC522 MISO  │
    │                    │                    │
    │  GPIO 25 ──220Ω────┼──── LED Green (+) │
    │  GPIO 26 ──220Ω────┼──── LED Red (+)   │
    │  GPIO 27 ──────────┼──── Buzzer (+)    │
    │                    │                    │
    │  3.3V    ──────────┼──── MFRC522 3.3V  │
    │  GND     ──────────┼──── All GND       │
    └────────────────────┴────────────────────┘
```

### Step-by-Step Wiring

#### 1. MFRC522 RFID Reader

```
MFRC522 Pin →  ESP32 Pin
─────────────────────────
SDA (SS)    →  GPIO 21
SCK         →  GPIO 18
MOSI        →  GPIO 23
MISO        →  GPIO 19
IRQ         →  Not connected
GND         →  GND
RST         →  GPIO 22
3.3V        →  3.3V
```

**IMPORTANT:**
- MFRC522 hanya support 3.3V!
- Jangan hubungkan ke 5V, akan rusak!
- IRQ pin tidak digunakan

#### 2. LED Indicators

**Green LED (Success):**
```
GPIO 25 → 220Ω Resistor → LED Anode (+) → LED Cathode (-) → GND
```

**Red LED (Error):**
```
GPIO 26 → 220Ω Resistor → LED Anode (+) → LED Cathode (-) → GND
```

**LED Polarity:**
- Anode (+): Kaki panjang
- Cathode (-): Kaki pendek

#### 3. Buzzer

```
Buzzer Pin  →  Connection
─────────────────────────
+ (Positive)→  GPIO 27
- (Negative)→  GND
```

**Notes:**
- Gunakan active buzzer (built-in oscillator)
- Passive buzzer memerlukan PWM signal

## Power Supply

### Power Requirements

**Gas Sensor Module:**
- ESP32: ~160mA (WiFi active)
- MQ Sensors: ~150mA each × 3 = 450mA
- DHT22: ~2.5mA
- **Total: ~600mA @ 5V**

**RFID Reader Module:**
- ESP32: ~160mA
- MFRC522: ~26mA
- LEDs: ~20mA each × 2 = 40mA
- Buzzer: ~30mA
- **Total: ~250mA @ 5V**

### Power Supply Options

#### Option 1: USB Power (Development)
```
USB Cable (5V 2A) → ESP32 VIN pin
```
- Mudah untuk development
- Tidak cocok untuk deployment

#### Option 2: External Power Supply (Production)
```
5V 2A Power Adapter → Breadboard Power Rail → ESP32 VIN
```
- Stabil untuk production
- Bisa power multiple devices

#### Option 3: Battery Power (Portable)
```
Li-Po Battery 3.7V → Step-up Converter 5V → ESP32 VIN
```
- Portable solution
- Perlu battery management

## Testing

### 1. Visual Inspection

Sebelum power on, cek:
- [ ] Tidak ada short circuit
- [ ] Semua koneksi kencang
- [ ] Polaritas LED benar
- [ ] MFRC522 di 3.3V (bukan 5V!)
- [ ] Power supply voltage benar

### 2. Power On Test

```cpp
void setup() {
  Serial.begin(115200);
  Serial.println("Testing...");
  
  // Test LED
  pinMode(LED_GREEN_PIN, OUTPUT);
  digitalWrite(LED_GREEN_PIN, HIGH);
  delay(500);
  digitalWrite(LED_GREEN_PIN, LOW);
  
  // Test Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("Test OK!");
}
```

### 3. Sensor Test

**Gas Sensors:**
```cpp
void testGasSensors() {
  int mq4 = analogRead(MQ4_PIN);
  int mq135 = analogRead(MQ135_PIN);
  int mq137 = analogRead(MQ137_PIN);
  
  Serial.print("MQ-4: "); Serial.println(mq4);
  Serial.print("MQ-135: "); Serial.println(mq135);
  Serial.print("MQ-137: "); Serial.println(mq137);
}
```

**RFID Reader:**
```cpp
void testRFID() {
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print("MFRC522 Version: 0x");
  Serial.println(version, HEX);
  // Should print 0x91 or 0x92
}
```

## Troubleshooting

### Gas Sensor Issues

**Problem: Sensor readings always 0**
- Check power supply (5V)
- Check analog pin connections
- Wait for warm-up (2-3 minutes)
- Check if sensor is damaged

**Problem: Readings too high/low**
- Calibrate R0 in clean air
- Check voltage divider if used
- Verify sensor datasheet curve

**Problem: Unstable readings**
- Add capacitor (100nF) across VCC-GND
- Check power supply stability
- Move away from noise sources

### RFID Reader Issues

**Problem: MFRC522 not detected (version 0x00 or 0xFF)**
- Check 3.3V power (NOT 5V!)
- Check SPI connections
- Check RST pin connection
- Try different MFRC522 module

**Problem: Cannot read tags**
- Check antenna connection
- Increase antenna gain in code
- Try different tags
- Check tag frequency (13.56MHz)

**Problem: Reads same tag multiple times**
- Implement cooldown period in code
- Check PICC_HaltA() is called
- Add delay between reads

### WiFi Issues

**Problem: Cannot connect to WiFi**
- Check SSID and password
- Check WiFi signal strength
- Try static IP instead of DHCP
- Check router settings

**Problem: WiFi keeps disconnecting**
- Check power supply stability
- Reduce WiFi power consumption
- Add reconnection logic
- Check router distance

### MQTT Issues

**Problem: Cannot connect to MQTT broker**
- Check broker IP address
- Check broker is running
- Check firewall settings
- Try without authentication first

**Problem: Messages not received**
- Check topic names
- Check QoS settings
- Check broker logs
- Verify payload format

## Safety Considerations

### Electrical Safety

1. **Always disconnect power** before wiring
2. **Check polarity** before connecting
3. **Use proper wire gauge** for current
4. **Avoid short circuits** - double check connections
5. **Use fuses** for protection

### Sensor Safety

1. **MQ sensors get HOT** - don't touch during operation
2. **Proper ventilation** - sensors need air flow
3. **Calibration** - calibrate in clean air
4. **Warm-up time** - wait 2-3 minutes before readings

### Deployment Safety

1. **Weatherproof enclosure** for outdoor use
2. **Proper mounting** - secure and stable
3. **Cable management** - protect from animals
4. **Regular maintenance** - check connections monthly
5. **Backup power** - consider UPS for critical systems

## Next Steps

1. ✅ Complete wiring
2. ✅ Test all components
3. ✅ Upload firmware
4. ✅ Configure WiFi and MQTT
5. ✅ Verify device appears in dashboard
6. ✅ Deploy to location
7. ✅ Monitor and maintain

## Resources

- [ESP32 Pinout Reference](https://randomnerdtutorials.com/esp32-pinout-reference-gpios/)
- [MFRC522 Datasheet](https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf)
- [MQ Sensor Datasheets](https://www.pololu.com/category/152/gas-sensors)
- [DHT22 Datasheet](https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf)

## Support

Untuk bantuan lebih lanjut:
- GitHub Issues: [repository-url]
- Email: support@livestock-monitoring.com
- Forum: [forum-url]
