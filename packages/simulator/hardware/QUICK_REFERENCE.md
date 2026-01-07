# 📋 Quick Reference Card

Referensi cepat untuk teknisi lapangan. Print dan bawa saat deployment!

---

## 🔌 Pin Connections

### Gas Sensor Module (ESP32)

```
MQ-4    → GPIO 34    DHT22   → GPIO 4
MQ-135  → GPIO 35    VCC     → 5V
MQ-137  → GPIO 32    GND     → GND
```

### RFID Reader Module (ESP32)

```
MFRC522:              Indicators:
SDA  → GPIO 21        LED Green → GPIO 25
RST  → GPIO 22        LED Red   → GPIO 26
SCK  → GPIO 18        Buzzer    → GPIO 27
MOSI → GPIO 23        
MISO → GPIO 19        All → 220Ω resistor
3.3V → 3.3V (NOT 5V!)
GND  → GND
```

---

## ⚡ Power Requirements

| Module | Voltage | Current | Power |
|--------|---------|---------|-------|
| Gas Sensor | 5V | 600mA | 3W |
| RFID Reader | 5V | 250mA | 1.25W |

⚠️ **IMPORTANT:** MFRC522 hanya 3.3V! Jangan hubungkan ke 5V!

---

## 📡 MQTT Topics

```
sensors/gas/{DEVICE_ID}
livestock/devices/{DEVICE_ID}/status
livestock/devices/{DEVICE_ID}/heartbeat
livestock/devices/{DEVICE_ID}/error
```

---

## 🔧 Configuration Checklist

```cpp
// config.h - MUST CONFIGURE:
#define WIFI_SSID "___________"
#define WIFI_PASSWORD "___________"
#define MQTT_SERVER "___________"
#define DEVICE_ID "___________"
#define BARN_ID "___________"
```

---

## 🧪 Testing Commands

### Serial Monitor Test
```
Baud rate: 115200
Expected output:
- "WiFi connected!"
- "MQTT connected!"
- "Device status: online"
- Sensor readings every 10s
- Heartbeat every 30s
```

### WiFi Signal Test
```cpp
long rssi = WiFi.RSSI();
// Good: > -70 dBm
// Fair: -70 to -80 dBm
// Poor: < -80 dBm
```

### MFRC522 Version Check
```cpp
byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
// Should return: 0x91 or 0x92
// If 0x00 or 0xFF: Check wiring!
```

---

## 🚨 Troubleshooting Quick Fixes

### WiFi Won't Connect
1. ✓ Check SSID/password
2. ✓ Check signal strength
3. ✓ Restart device
4. ✓ Try static IP

### MQTT Won't Connect
1. ✓ Check broker IP
2. ✓ Ping broker
3. ✓ Check firewall
4. ✓ Verify port 1883

### Sensor Readings Zero
1. ✓ Check power (5V)
2. ✓ Check connections
3. ✓ Wait warm-up (2-3 min)
4. ✓ Check sensor not damaged

### RFID Not Reading
1. ✓ Check 3.3V (NOT 5V!)
2. ✓ Check SPI connections
3. ✓ Try different tag
4. ✓ Check antenna

---

## 📊 Normal Values

### Gas Sensors (Clean Air)
```
Methane (CH4):  200-500 ppm
CO2:            800-1500 ppm
NH3:            5-15 ppm
Temperature:    20-30°C
Humidity:       40-80%
```

### Alert Thresholds
```
WARNING:
- CH4 > 500 ppm
- CO2 > 2000 ppm
- NH3 > 15 ppm

DANGER:
- CH4 > 1000 ppm
- CO2 > 3000 ppm
- NH3 > 25 ppm
```

---

## 🔄 Calibration Quick Steps

1. **Warm-up**: 2-3 minutes
2. **Clean air**: Move to outdoor/ventilated area
3. **Run calibration sketch**
4. **Record R0 values**
5. **Update config.h**
6. **Re-upload code**

---

## 📱 Dashboard URLs

```
Frontend:  http://localhost:3000
Backend:   http://localhost:3001
Devices:   http://localhost:3000/devices
```

---

## 🛠️ Tools Needed

- [ ] Screwdriver set
- [ ] Multimeter
- [ ] Laptop + USB cable
- [ ] WiFi analyzer app
- [ ] Label maker
- [ ] Camera
- [ ] Notebook

---

## 📞 Emergency Contacts

```
Technical Support:
Email: support@livestock-monitoring.com
Phone: +62-XXX-XXXX-XXXX

On-Call Engineer:
Name: _______________
Phone: _______________
```

---

## ✅ Pre-Deployment Checklist

- [ ] Hardware assembled correctly
- [ ] All connections secure
- [ ] Power supply tested (5V)
- [ ] Code uploaded successfully
- [ ] WiFi credentials configured
- [ ] MQTT broker configured
- [ ] Device ID unique
- [ ] Sensors calibrated
- [ ] Lab test passed
- [ ] Device appears in dashboard
- [ ] Enclosure ready
- [ ] Mounting hardware ready
- [ ] Tools prepared
- [ ] Documentation ready

---

## 📍 Installation Checklist

- [ ] Location surveyed
- [ ] WiFi signal tested (> -70 dBm)
- [ ] Power outlet available
- [ ] Device mounted securely
- [ ] Cables protected
- [ ] Power connected
- [ ] Device powered on
- [ ] WiFi connected
- [ ] MQTT connected
- [ ] Device online in dashboard
- [ ] Sensor readings visible
- [ ] Photos taken
- [ ] Documentation completed

---

## 🔍 Post-Installation Checks

### Hour 1
- [ ] Device still online
- [ ] Readings continuous
- [ ] No errors

### Hour 4
- [ ] No disconnections
- [ ] Readings consistent
- [ ] Performance stable

### Day 1
- [ ] Uptime 100%
- [ ] No anomalies
- [ ] All functions working

---

## 💾 Backup Information

```
DEVICE INFORMATION CARD

Device ID: _______________
Device Type: Gas Sensor / RFID Reader
Location: _______________
Barn ID: _______________

Installation Date: _______________
Installer: _______________

Network:
WiFi SSID: _______________
IP Address: _______________
MAC Address: _______________

MQTT Broker: _______________

Calibration Values:
MQ-4 R0: _______________
MQ-135 R0: _______________
MQ-137 R0: _______________

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🎯 Success Criteria

✅ Device online in dashboard
✅ Status shows "online"
✅ Sensor readings updating
✅ Heartbeat every 30 seconds
✅ No error messages
✅ WiFi signal > -70 dBm
✅ Uptime > 99%

---

## 📚 Documentation Links

- Full docs: `packages/simulator/hardware/`
- Wiring: `WIRING_GUIDE.md`
- Calibration: `CALIBRATION_GUIDE.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`
- FAQ: `FAQ.md`

---

**Print this card and keep it with you during deployment!**

**Version:** 1.0.0 | **Date:** January 7, 2024
