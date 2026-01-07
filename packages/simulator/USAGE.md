# Simulator Usage Guide

## Quick Start

### 1. Setup

```bash
cd packages/simulator
./setup.sh
```

This will:
- Create a Python virtual environment
- Install required dependencies
- Create a `.env` file from the example

### 2. Configure

Edit `.env` file with your settings:

```bash
# MQTT Configuration
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883

# Backend API Configuration
BACKEND_API_URL=http://localhost:3001

# Simulator Configuration
NUM_GAS_SENSORS=3
GAS_SENSOR_INTERVAL=10
RFID_EVENT_INTERVAL=30
```

### 3. Run

Activate the virtual environment:
```bash
source venv/bin/activate
```

Run both simulators:
```bash
python main.py
```

Or run individually:
```bash
# Gas sensors only
python gas_sensor_simulator.py

# RFID readers only
python rfid_reader_simulator.py
```

## Gas Sensor Simulator

### What it does
- Simulates multiple ESP32 gas sensors
- Publishes MQTT messages to `sensors/gas/{sensorId}` topics
- Generates realistic variations in gas levels
- Simulates normal, warning, and danger conditions

### Message Format
```json
{
  "sensorId": "GAS-001",
  "barnId": "barn-001",
  "methanePpm": 450.23,
  "co2Ppm": 1800.45,
  "nh3Ppm": 12.34,
  "temperature": 24.5,
  "humidity": 65.2,
  "timestamp": "2026-01-07T10:30:00.000Z"
}
```

### Gas Level Conditions

**Normal (75% of readings)**
- Methane: 200-500 ppm
- CO2: 800-1500 ppm
- NH3: 5-10 ppm

**Warning (20% of readings)**
- Methane: 500-900 ppm
- CO2: 2000-2800 ppm
- NH3: 15-23 ppm

**Danger (5% of readings)**
- Methane: 1000-2000 ppm
- CO2: 3000-5000 ppm
- NH3: 25-50 ppm

### Configuration Options

- `NUM_GAS_SENSORS`: Number of sensors (default: 3)
- `GAS_SENSOR_INTERVAL`: Seconds between readings (default: 10)
- `MQTT_BROKER_HOST`: MQTT broker hostname (default: localhost)
- `MQTT_BROKER_PORT`: MQTT broker port (default: 1883)

## RFID Reader Simulator

### What it does
- Simulates RFID readers at barn entrances
- Sends HTTP POST requests to `/api/logs` endpoint
- Generates random livestock entry/exit events
- Tracks livestock locations

### Event Format
```json
{
  "livestockId": "livestock-001",
  "barnId": "barn-001",
  "eventType": "entry",
  "rfidReaderId": "RFID-READER-001",
  "timestamp": "2026-01-07T10:30:00.000Z"
}
```

### Event Types
- `entry`: Livestock enters a barn
- `exit`: Livestock exits a barn

### Movement Logic
- If livestock is outside → 70% chance of entry event
- If livestock is inside → 30% chance of exit event
- Random barn and reader selection

### Configuration Options

- `RFID_EVENT_INTERVAL`: Seconds between events (default: 30)
- `BACKEND_API_URL`: Backend API URL (default: http://localhost:3001)

### Batch Mode

Generate a specific number of events for testing:

```bash
python rfid_reader_simulator.py --batch 20
```

This will generate 20 events with 1 second delay between each.

## Sample Data

### Barn IDs
- barn-001
- barn-002
- barn-003
- barn-004
- barn-005

### Livestock IDs
- livestock-001 through livestock-010

### Reader IDs
- RFID-READER-001 through RFID-READER-005

**Note**: These IDs should match actual records in your database for the simulator to work correctly with the backend.

## Troubleshooting

### MQTT Connection Failed
- Ensure Mosquitto is running: `docker-compose up mosquitto`
- Check MQTT broker host and port in `.env`
- Verify firewall settings

### Backend Connection Failed
- Ensure backend is running: `cd packages/backend && npm run start:dev`
- Check backend URL in `.env`
- Verify backend is accessible at the configured URL

### Invalid Livestock/Barn IDs
- The simulator uses sample IDs that may not exist in your database
- Create matching records in the database, or
- Modify the simulator code to use your actual IDs

### Python Dependencies
If you encounter import errors:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## Advanced Usage

### Custom Sensor IDs

Edit `gas_sensor_simulator.py` to customize sensor IDs:

```python
def _initialize_sensors(self):
    barn_ids = ["your-barn-1", "your-barn-2"]
    # ... customize as needed
```

### Custom Livestock IDs

Edit `rfid_reader_simulator.py` to customize livestock IDs:

```python
def _initialize_sample_data(self):
    self.livestock_ids = ["your-livestock-1", "your-livestock-2"]
    # ... customize as needed
```

### Adjust Event Probabilities

In `gas_sensor_simulator.py`, modify the condition weights:

```python
condition = random.choices(
    ["normal", "warning", "danger"],
    weights=[0.75, 0.20, 0.05],  # Adjust these
)[0]
```

In `rfid_reader_simulator.py`, modify movement patterns in `_generate_event()`.

## Integration with System

### Prerequisites
1. Docker services running (MongoDB, Redis, Mosquitto)
2. Backend API running
3. Database seeded with matching barn and livestock records

### Recommended Workflow
1. Start Docker services: `docker-compose up -d`
2. Start backend: `cd packages/backend && npm run start:dev`
3. Seed database with test data
4. Start simulator: `cd packages/simulator && python main.py`
5. Monitor frontend dashboard for real-time updates

## Stopping the Simulator

Press `Ctrl+C` to gracefully stop all simulators.

The simulators will:
- Disconnect from MQTT broker
- Stop generating events
- Clean up resources
