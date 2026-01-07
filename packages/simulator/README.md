# Livestock IoT Simulator

Python-based simulator for testing the Livestock IoT Monitoring System. Simulates gas sensors publishing MQTT messages and RFID readers sending HTTP requests.

## Features

- **Gas Sensor Simulator**: Publishes realistic gas sensor readings (Methane, CO2, NH3, Temperature, Humidity) via MQTT
- **RFID Reader Simulator**: Simulates livestock entry/exit events via HTTP API

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
