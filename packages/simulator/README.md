# Livestock IoT Simulator

Python-based simulator for testing the Livestock IoT Monitoring System. Simulates gas sensors publishing MQTT messages and RFID readers sending HTTP requests.

## 📋 Contents

- [Python Simulators](#python-simulators) - Software simulators for testing
- [Hardware Implementation](#hardware-implementation) - Real ESP32/Arduino code for production

## Python Simulators

### Features

- **Gas Sensor Simulator**: Publishes realistic gas sensor readings (Methane, CO2, NH3, Temperature, Humidity) via MQTT
- **RFID Reader Simulator**: Simulates livestock entry/exit events via HTTP API
- **Device Management**: Auto-registration, heartbeat, error simulation

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration

## Usage

### Run Gas Sensor Simulator
```bash
python gas_sensor_simulator.py
```

### Run RFID Reader Simulator
```bash
python rfid_reader_simulator.py
```

### Run Both Simulators
```bash
python main.py
```

## Configuration

- `NUM_GAS_SENSORS`: Number of gas sensors to simulate (default: 3)
- `GAS_SENSOR_INTERVAL`: Seconds between sensor readings (default: 10)
- `RFID_EVENT_INTERVAL`: Seconds between RFID events (default: 30)
- `MQTT_BROKER_HOST`: MQTT broker hostname (default: localhost)
- `MQTT_BROKER_PORT`: MQTT broker port (default: 1883)
- `BACKEND_API_URL`: Backend API URL (default: http://localhost:3001)

## Gas Sensor Data

The simulator generates realistic variations in gas levels:
- **Normal conditions**: Low gas levels with small variations
- **Warning conditions**: Elevated gas levels (20% chance)
- **Danger conditions**: Critical gas levels (5% chance)

## RFID Events

The simulator randomly generates entry/exit events for livestock, simulating realistic barn activity patterns.

## Hardware Implementation

Untuk implementasi hardware sebenarnya menggunakan ESP32, Arduino, atau mikrokontroler lainnya, lihat dokumentasi lengkap di folder `hardware/`:

### 📚 Documentation

- **[Hardware README](./hardware/README.md)** - Overview dan requirements
- **[Wiring Guide](./hardware/WIRING_GUIDE.md)** - Panduan lengkap wiring dan assembly
- **[Calibration Guide](./hardware/CALIBRATION_GUIDE.md)** - Panduan kalibrasi sensor

### 💻 Code Examples

- **[esp32_gas_sensor.ino](./hardware/esp32_gas_sensor.ino)** - ESP32 gas sensor implementation
- **[esp32_rfid_reader.ino](./hardware/esp32_rfid_reader.ino)** - ESP32 RFID reader implementation
- **[arduino_gas_sensor.ino](./hardware/arduino_gas_sensor.ino)** - Arduino with Ethernet Shield
- **[config.h](./hardware/config.h)** - Configuration template
- **[platformio.ini](./hardware/platformio.ini)** - PlatformIO configuration

### 🔧 Hardware Requirements

**Gas Sensor Module:**
- ESP32 DevKit
- MQ-4 (Methane), MQ-135 (CO2), MQ-137 (NH3)
- DHT22 (Temperature & Humidity)
- Power supply 5V 2A

**RFID Reader Module:**
- ESP32 DevKit
- MFRC522 RFID Reader
- LED indicators & Buzzer
- Power supply 5V 2A

### 🚀 Quick Start (Hardware)

1. Wire components according to [Wiring Guide](./hardware/WIRING_GUIDE.md)
2. Install Arduino IDE or PlatformIO
3. Install required libraries (see [Hardware README](./hardware/README.md))
4. Copy and configure `config.h`
5. Upload code to ESP32
6. Calibrate sensors (see [Calibration Guide](./hardware/CALIBRATION_GUIDE.md))
7. Device akan auto-register ke backend saat pertama kali connect

### 📡 MQTT Topics

Hardware devices menggunakan MQTT topics yang sama dengan simulator:

```
sensors/gas/{DEVICE_ID}                    - Sensor readings
livestock/devices/{DEVICE_ID}/status       - Device status
livestock/devices/{DEVICE_ID}/heartbeat    - Heartbeat
livestock/devices/{DEVICE_ID}/error        - Error messages
```

### 🔐 Features

- ✅ Auto-registration dengan backend
- ✅ WiFi auto-reconnect
- ✅ MQTT auto-reconnect
- ✅ Heartbeat monitoring
- ✅ Error reporting
- ✅ Visual feedback (LEDs)
- ✅ Audio feedback (Buzzer)
- ✅ Sensor calibration support

## Documentation

- [Implementation Details](./IMPLEMENTATION.md)
- [Usage Guide](./USAGE.md)
- [Device Management Integration](./DEVICE-MANAGEMENT-INTEGRATION.md)
