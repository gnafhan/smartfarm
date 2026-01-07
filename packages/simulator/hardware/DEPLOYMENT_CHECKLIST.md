# ✅ Hardware Deployment Checklist

Checklist lengkap untuk deployment IoT devices ke lokasi peternakan.

## Pre-Deployment

### Hardware Preparation

- [ ] **Semua komponen tersedia**
  - [ ] ESP32 DevKit
  - [ ] Sensors (MQ-4, MQ-135, MQ-137, DHT22 atau MFRC522)
  - [ ] LEDs dan Buzzer (untuk RFID reader)
  - [ ] Resistors dan jumper wires
  - [ ] Breadboard atau PCB
  - [ ] Power supply 5V 2A
  - [ ] Enclosure (weatherproof jika outdoor)

- [ ] **Wiring completed**
  - [ ] Follow wiring guide
  - [ ] Double-check all connections
  - [ ] No short circuits
  - [ ] Proper polarity
  - [ ] Secure connections

- [ ] **Power supply tested**
  - [ ] Voltage correct (5V)
  - [ ] Current sufficient (2A minimum)
  - [ ] Stable output
  - [ ] Proper grounding

### Software Preparation

- [ ] **Development environment setup**
  - [ ] Arduino IDE atau PlatformIO installed
  - [ ] ESP32 board support installed
  - [ ] All libraries installed
  - [ ] USB drivers installed

- [ ] **Code configuration**
  - [ ] `config.h` copied and configured
  - [ ] WiFi SSID and password set
  - [ ] MQTT broker IP configured
  - [ ] Device ID unique
  - [ ] Barn ID correct

- [ ] **Code uploaded**
  - [ ] Compilation successful
  - [ ] Upload successful
  - [ ] No errors in serial monitor

### Testing (Lab/Office)

- [ ] **Basic functionality**
  - [ ] Device powers on
  - [ ] LEDs working (if applicable)
  - [ ] Buzzer working (if applicable)
  - [ ] Serial output readable

- [ ] **WiFi connectivity**
  - [ ] Connects to WiFi
  - [ ] Gets IP address
  - [ ] Signal strength adequate (> -70 dBm)
  - [ ] Reconnects after disconnect

- [ ] **MQTT connectivity**
  - [ ] Connects to MQTT broker
  - [ ] Publishes messages
  - [ ] Reconnects after disconnect
  - [ ] QoS working correctly

- [ ] **Sensor readings**
  - [ ] Gas sensors reading (if gas sensor module)
  - [ ] DHT22 reading temp/humidity (if gas sensor module)
  - [ ] RFID reader detecting tags (if RFID module)
  - [ ] Readings within expected range

- [ ] **Device management**
  - [ ] Device auto-registers in backend
  - [ ] Status updates working
  - [ ] Heartbeat messages sent
  - [ ] Error messages working
  - [ ] Device appears in frontend dashboard

- [ ] **Sensor calibration**
  - [ ] R0 values measured (gas sensors)
  - [ ] Calibration values updated in config
  - [ ] Readings verified against reference
  - [ ] Consistency test passed

### Backend Verification

- [ ] **Backend ready**
  - [ ] Backend server running
  - [ ] MongoDB connected
  - [ ] MQTT broker running
  - [ ] Redis running (if used)

- [ ] **API endpoints working**
  - [ ] Device registration endpoint
  - [ ] Sensor data endpoint
  - [ ] RFID log endpoint
  - [ ] Device status endpoint

- [ ] **Frontend verification**
  - [ ] Device appears in device list
  - [ ] Status shows "online"
  - [ ] Sensor readings displayed (gas sensor)
  - [ ] RFID events logged (RFID reader)
  - [ ] Real-time updates working

## Deployment Day

### Site Preparation

- [ ] **Location survey**
  - [ ] Mounting location identified
  - [ ] WiFi signal tested at location
  - [ ] Power outlet available
  - [ ] Protected from weather
  - [ ] Protected from animals
  - [ ] Accessible for maintenance

- [ ] **WiFi setup**
  - [ ] WiFi router/AP installed (if needed)
  - [ ] WiFi coverage verified
  - [ ] Signal strength > -70 dBm
  - [ ] SSID and password documented

- [ ] **Power setup**
  - [ ] Power outlet tested
  - [ ] Voltage stable
  - [ ] Grounding proper
  - [ ] Surge protection (recommended)
  - [ ] UPS backup (recommended)

### Installation

- [ ] **Physical mounting**
  - [ ] Enclosure mounted securely
  - [ ] Height appropriate for function
  - [ ] Orientation correct
  - [ ] Ventilation adequate (gas sensors)
  - [ ] Cable management neat

- [ ] **Power connection**
  - [ ] Power cable connected
  - [ ] Cable secured
  - [ ] No strain on connectors
  - [ ] Weatherproofing (if outdoor)

- [ ] **Device startup**
  - [ ] Power on device
  - [ ] Wait for boot (30 seconds)
  - [ ] Check LED indicators
  - [ ] Listen for buzzer (RFID reader)

### On-Site Testing

- [ ] **Connectivity test**
  - [ ] Device connects to WiFi
  - [ ] Device connects to MQTT
  - [ ] Device registers with backend
  - [ ] Status shows "online" in dashboard

- [ ] **Sensor test (Gas Sensor)**
  - [ ] Readings appear in dashboard
  - [ ] Values reasonable
  - [ ] Updates every 10 seconds
  - [ ] Temperature/humidity working

- [ ] **RFID test (RFID Reader)**
  - [ ] Scan test tag
  - [ ] LED lights up
  - [ ] Buzzer sounds
  - [ ] Event logged in backend
  - [ ] Event appears in dashboard

- [ ] **Range test (RFID Reader)**
  - [ ] Test read distance
  - [ ] Verify minimum 5cm range
  - [ ] Adjust antenna if needed

- [ ] **Heartbeat verification**
  - [ ] Wait 30 seconds
  - [ ] Verify heartbeat in logs
  - [ ] Check "last heartbeat" timestamp

### Documentation

- [ ] **Installation record**
  - [ ] Device ID recorded
  - [ ] Location documented
  - [ ] Installation date/time
  - [ ] Installer name
  - [ ] Photos taken

- [ ] **Configuration backup**
  - [ ] config.h backed up
  - [ ] Calibration values recorded
  - [ ] WiFi credentials documented
  - [ ] Device mapping (ID → Location)

- [ ] **Network information**
  - [ ] IP address recorded
  - [ ] MAC address recorded
  - [ ] WiFi SSID documented
  - [ ] MQTT broker IP documented

## Post-Deployment

### Monitoring (First 24 Hours)

- [ ] **Hour 1: Immediate monitoring**
  - [ ] Device still online
  - [ ] Readings continuous
  - [ ] No error messages
  - [ ] Heartbeat regular

- [ ] **Hour 4: Short-term stability**
  - [ ] Device still online
  - [ ] No disconnections
  - [ ] Readings consistent
  - [ ] No errors

- [ ] **Hour 24: Daily stability**
  - [ ] Device uptime 100%
  - [ ] Readings continuous
  - [ ] No anomalies
  - [ ] Performance stable

### Week 1 Monitoring

- [ ] **Daily checks**
  - [ ] Device online status
  - [ ] Sensor readings reasonable
  - [ ] No error accumulation
  - [ ] Heartbeat consistent

- [ ] **Weekly review**
  - [ ] Uptime percentage > 99%
  - [ ] Error count acceptable
  - [ ] Readings within range
  - [ ] No hardware issues

### Maintenance Schedule

- [ ] **Weekly (First month)**
  - [ ] Visual inspection
  - [ ] Check connections
  - [ ] Clean sensors (if needed)
  - [ ] Verify readings

- [ ] **Monthly (After stabilization)**
  - [ ] Full inspection
  - [ ] Sensor calibration check
  - [ ] Firmware update (if available)
  - [ ] Performance review

- [ ] **Quarterly**
  - [ ] Deep cleaning
  - [ ] Re-calibration
  - [ ] Hardware check
  - [ ] Documentation update

- [ ] **Annually**
  - [ ] Complete overhaul
  - [ ] Sensor replacement (if needed)
  - [ ] Firmware update
  - [ ] Performance audit

## Troubleshooting On-Site

### Device Won't Connect to WiFi

1. [ ] Check WiFi credentials in config.h
2. [ ] Verify WiFi signal strength
3. [ ] Try static IP instead of DHCP
4. [ ] Check router settings
5. [ ] Restart device

### Device Won't Connect to MQTT

1. [ ] Verify MQTT broker IP
2. [ ] Check broker is running
3. [ ] Test with MQTT client tool
4. [ ] Check firewall settings
5. [ ] Verify authentication (if used)

### Sensor Readings Abnormal

1. [ ] Check sensor connections
2. [ ] Verify power supply voltage
3. [ ] Re-calibrate sensors
4. [ ] Check for physical damage
5. [ ] Replace sensor if faulty

### RFID Not Reading Tags

1. [ ] Check MFRC522 connections
2. [ ] Verify 3.3V power (not 5V!)
3. [ ] Test with different tags
4. [ ] Check antenna
5. [ ] Increase antenna gain in code

### Device Keeps Disconnecting

1. [ ] Check power supply stability
2. [ ] Verify WiFi signal strength
3. [ ] Check for interference
4. [ ] Update firmware
5. [ ] Check for hardware issues

## Emergency Contacts

```
Technical Support:
- Email: support@livestock-monitoring.com
- Phone: +62-XXX-XXXX-XXXX
- WhatsApp: +62-XXX-XXXX-XXXX

On-Call Engineer:
- Name: _______________
- Phone: _______________

Backend Admin:
- Name: _______________
- Phone: _______________

Farm Manager:
- Name: _______________
- Phone: _______________
```

## Deployment Sign-Off

```
DEPLOYMENT COMPLETED

Device Information:
- Device ID: _______________
- Device Type: Gas Sensor / RFID Reader
- Location: _______________
- Barn ID: _______________

Installation:
- Date: _______________
- Time: _______________
- Installer: _______________
- Signature: _______________

Verification:
- Tested by: _______________
- Date: _______________
- Status: PASS / FAIL
- Signature: _______________

Acceptance:
- Accepted by: _______________
- Date: _______________
- Signature: _______________

Notes:
_________________________________
_________________________________
_________________________________
```

## Appendix

### Tools Required

- [ ] Screwdriver set
- [ ] Wire stripper
- [ ] Multimeter
- [ ] Laptop with Arduino IDE
- [ ] USB cable
- [ ] Network cable tester
- [ ] WiFi analyzer app
- [ ] Label maker
- [ ] Camera (for documentation)
- [ ] Notebook and pen

### Spare Parts

- [ ] Extra ESP32 DevKit
- [ ] Extra sensors
- [ ] Extra jumper wires
- [ ] Extra power supply
- [ ] Extra RFID tags
- [ ] Fuses
- [ ] Cable ties
- [ ] Mounting hardware

### Safety Equipment

- [ ] Safety glasses
- [ ] Gloves
- [ ] First aid kit
- [ ] Fire extinguisher nearby
- [ ] Emergency contact list

---

**Remember:** Safety first! Always follow proper electrical safety procedures and farm safety protocols.
