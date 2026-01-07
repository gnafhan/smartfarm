#!/usr/bin/env python3
"""
Main entry point for Livestock IoT Simulator

Runs both gas sensor and RFID reader simulators concurrently.

Requirements: Simulator for testing
Task: 28 - Python Simulator
"""

import os
import sys
import threading
import time
from dotenv import load_dotenv

# Import simulators
from gas_sensor_simulator import GasSensorSimulator
from rfid_reader_simulator import RFIDReaderSimulator

# Load environment variables
load_dotenv()


def run_gas_sensors():
    """Run gas sensor simulator in a thread"""
    try:
        broker_host = os.getenv("MQTT_BROKER_HOST", "localhost")
        broker_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))
        num_sensors = int(os.getenv("NUM_GAS_SENSORS", "3"))
        interval = int(os.getenv("GAS_SENSOR_INTERVAL", "10"))

        simulator = GasSensorSimulator(
            broker_host=broker_host,
            broker_port=broker_port,
            num_sensors=num_sensors,
            interval=interval,
        )

        simulator.connect()
        simulator.run()
    except Exception as e:
        print(f"Gas sensor simulator error: {e}")


def run_rfid_readers():
    """Run RFID reader simulator in a thread"""
    try:
        backend_url = os.getenv("BACKEND_API_URL", "http://localhost:3001")
        interval = int(os.getenv("RFID_EVENT_INTERVAL", "30"))

        # Give gas sensors time to start first
        time.sleep(2)

        simulator = RFIDReaderSimulator(
            backend_url=backend_url,
            interval=interval,
        )

        simulator.run()
    except Exception as e:
        print(f"RFID reader simulator error: {e}")


def main():
    """Main entry point - runs both simulators concurrently"""
    print("=" * 70)
    print("Livestock IoT Monitoring System - Simulator")
    print("=" * 70)
    print()
    print("This simulator runs:")
    print("  1. Gas Sensor Simulator (MQTT)")
    print("  2. RFID Reader Simulator (HTTP)")
    print()
    print("Configuration:")
    print(f"  MQTT Broker: {os.getenv('MQTT_BROKER_HOST', 'localhost')}:{os.getenv('MQTT_BROKER_PORT', '1883')}")
    print(f"  Backend API: {os.getenv('BACKEND_API_URL', 'http://localhost:3001')}")
    print(f"  Gas Sensors: {os.getenv('NUM_GAS_SENSORS', '3')}")
    print(f"  Gas Interval: {os.getenv('GAS_SENSOR_INTERVAL', '10')}s")
    print(f"  RFID Interval: {os.getenv('RFID_EVENT_INTERVAL', '30')}s")
    print()
    print("Press Ctrl+C to stop all simulators")
    print("=" * 70)
    print()

    # Create threads for each simulator
    gas_thread = threading.Thread(target=run_gas_sensors, daemon=True)
    rfid_thread = threading.Thread(target=run_rfid_readers, daemon=True)

    try:
        # Start both simulators
        gas_thread.start()
        rfid_thread.start()

        # Keep main thread alive
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n\nStopping all simulators...")
        print("Waiting for threads to finish...")
        
        # Give threads time to clean up
        time.sleep(2)
        
        print("All simulators stopped")
        sys.exit(0)


if __name__ == "__main__":
    main()
