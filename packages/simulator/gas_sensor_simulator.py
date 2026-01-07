#!/usr/bin/env python3
"""
Gas Sensor Simulator for Livestock IoT Monitoring System

Publishes realistic gas sensor readings via MQTT to simulate ESP32 gas sensors.
Generates variations in Methane, CO2, NH3, Temperature, and Humidity levels.

Requirements: Simulator for testing
Task: 28.1 - Implement gas sensor simulator
"""

import json
import random
import time
import os
from datetime import datetime
from typing import Dict, List
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class GasSensorSimulator:
    """Simulates multiple gas sensors publishing MQTT messages"""

    def __init__(
        self,
        broker_host: str = "localhost",
        broker_port: int = 1883,
        num_sensors: int = 3,
        interval: int = 10,
    ):
        """
        Initialize the gas sensor simulator
        
        Args:
            broker_host: MQTT broker hostname
            broker_port: MQTT broker port
            num_sensors: Number of sensors to simulate
            interval: Seconds between readings
        """
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.num_sensors = num_sensors
        self.interval = interval
        self.client = None
        self.sensors: List[Dict] = []
        self.running = False
        self.heartbeat_interval = 30  # Send heartbeat every 30 seconds
        self.last_heartbeat = {}
        self.error_probability = 0.02  # 2% chance of error per reading

        # Initialize sensors with IDs and barn assignments
        self._initialize_sensors()

    def _initialize_sensors(self):
        """Initialize sensor configurations"""
        barn_ids = [
            "BARN-001",
            "BARN-002",
        ]

        for i in range(self.num_sensors):
            sensor = {
                "sensorId": f"GAS-{str(i + 1).zfill(3)}",
                "barnId": barn_ids[i % len(barn_ids)],
                "baseline": {
                    "methanePpm": random.uniform(200, 400),
                    "co2Ppm": random.uniform(800, 1500),
                    "nh3Ppm": random.uniform(5, 10),
                    "temperature": random.uniform(20, 25),
                    "humidity": random.uniform(50, 70),
                },
            }
            self.sensors.append(sensor)

        print(f"Initialized {self.num_sensors} gas sensors:")
        for sensor in self.sensors:
            print(f"  - {sensor['sensorId']} -> {sensor['barnId']}")

    def _generate_reading(self, sensor: Dict) -> Dict:
        """
        Generate a realistic sensor reading with variations
        
        Simulates three conditions:
        - Normal: 75% chance - values near baseline
        - Warning: 20% chance - elevated levels
        - Danger: 5% chance - critical levels
        
        Args:
            sensor: Sensor configuration
            
        Returns:
            Sensor reading dictionary
        """
        baseline = sensor["baseline"]
        condition = random.choices(
            ["normal", "warning", "danger"],
            weights=[0.75, 0.20, 0.05],
        )[0]

        if condition == "normal":
            # Normal conditions - small variations around baseline
            methane = baseline["methanePpm"] + random.uniform(-50, 50)
            co2 = baseline["co2Ppm"] + random.uniform(-200, 200)
            nh3 = baseline["nh3Ppm"] + random.uniform(-2, 2)
        elif condition == "warning":
            # Warning conditions - elevated levels
            methane = random.uniform(500, 900)
            co2 = random.uniform(2000, 2800)
            nh3 = random.uniform(15, 23)
        else:  # danger
            # Danger conditions - critical levels
            methane = random.uniform(1000, 2000)
            co2 = random.uniform(3000, 5000)
            nh3 = random.uniform(25, 50)

        # Temperature and humidity have smaller variations
        temperature = baseline["temperature"] + random.uniform(-3, 3)
        humidity = baseline["humidity"] + random.uniform(-10, 10)

        # Ensure values are within realistic bounds
        methane = max(0, min(5000, methane))
        co2 = max(0, min(10000, co2))
        nh3 = max(0, min(100, nh3))
        temperature = max(-20, min(60, temperature))
        humidity = max(0, min(100, humidity))

        reading = {
            "sensorId": sensor["sensorId"],
            "barnId": sensor["barnId"],
            "methanePpm": round(methane, 2),
            "co2Ppm": round(co2, 2),
            "nh3Ppm": round(nh3, 2),
            "temperature": round(temperature, 2),
            "humidity": round(humidity, 2),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        return reading

    def _on_connect(self, client, userdata, flags, rc):
        """Callback for when the client connects to the broker"""
        if rc == 0:
            print(f"Connected to MQTT broker at {self.broker_host}:{self.broker_port}")
            self.running = True
            # Send online status for all sensors
            for sensor in self.sensors:
                self._send_device_status(sensor['sensorId'], 'online')
        else:
            print(f"Failed to connect to MQTT broker, return code: {rc}")
            self.running = False

    def _on_disconnect(self, client, userdata, rc):
        """Callback for when the client disconnects from the broker"""
        print(f"Disconnected from MQTT broker, return code: {rc}")
        self.running = False
        # Note: Can't send offline status here as we're already disconnected

    def _on_publish(self, client, userdata, mid):
        """Callback for when a message is published"""
        pass  # Silent success

    def _send_device_status(self, device_id: str, status: str, reason: str = None, message: str = None):
        """
        Send device status update
        
        Args:
            device_id: Device identifier
            status: 'online', 'offline', 'connected', 'disconnected'
            reason: Disconnect reason (intentional, timeout, error, network)
            message: Additional message
        """
        topic = f"livestock/devices/{device_id}/status"
        payload = {
            "status": status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "metadata": {
                "type": "gas_sensor",
                "version": "1.0.0"
            }
        }
        
        if reason:
            payload["reason"] = reason
        if message:
            payload["message"] = message
            
        try:
            self.client.publish(topic, json.dumps(payload), qos=1)
        except Exception as e:
            print(f"Error sending device status: {e}")

    def _send_heartbeat(self, device_id: str):
        """
        Send device heartbeat
        
        Args:
            device_id: Device identifier
        """
        topic = f"livestock/devices/{device_id}/heartbeat"
        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        try:
            self.client.publish(topic, json.dumps(payload), qos=0)
            self.last_heartbeat[device_id] = time.time()
        except Exception as e:
            print(f"Error sending heartbeat: {e}")

    def _send_device_error(self, device_id: str, error: str, error_code: str = None):
        """
        Send device error
        
        Args:
            device_id: Device identifier
            error: Error message
            error_code: Error code
        """
        topic = f"livestock/devices/{device_id}/error"
        payload = {
            "error": error,
            "message": error,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "metadata": {
                "type": "gas_sensor"
            }
        }
        
        if error_code:
            payload["errorCode"] = error_code
            
        try:
            self.client.publish(topic, json.dumps(payload), qos=1)
            print(f"[ERROR] {device_id}: {error}")
        except Exception as e:
            print(f"Error sending device error: {e}")

    def connect(self):
        """Connect to the MQTT broker"""
        try:
            self.client = mqtt.Client(
                client_id=f"gas-sensor-simulator-{int(time.time())}"
            )
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_publish = self._on_publish

            print(f"Connecting to MQTT broker at {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()

            # Wait for connection
            timeout = 10
            start_time = time.time()
            while not self.running and (time.time() - start_time) < timeout:
                time.sleep(0.1)

            if not self.running:
                raise Exception("Failed to connect within timeout")

        except Exception as e:
            print(f"Error connecting to MQTT broker: {e}")
            raise

    def publish_reading(self, sensor: Dict):
        """
        Publish a sensor reading to MQTT
        
        Args:
            sensor: Sensor configuration
        """
        sensor_id = sensor['sensorId']
        
        # Check if we should send heartbeat
        current_time = time.time()
        last_hb = self.last_heartbeat.get(sensor_id, 0)
        if current_time - last_hb >= self.heartbeat_interval:
            self._send_heartbeat(sensor_id)
        
        # Simulate random errors
        if random.random() < self.error_probability:
            error_types = [
                ("SENSOR_READ_FAIL", "Failed to read sensor data"),
                ("SENSOR_CALIBRATION", "Sensor calibration error"),
                ("SENSOR_TIMEOUT", "Sensor read timeout"),
                ("SENSOR_MALFUNCTION", "Sensor malfunction detected"),
            ]
            error_code, error_msg = random.choice(error_types)
            self._send_device_error(sensor_id, error_msg, error_code)
            return  # Skip this reading
        
        reading = self._generate_reading(sensor)
        topic = f"sensors/gas/{reading['sensorId']}"
        payload = json.dumps(reading)

        try:
            result = self.client.publish(topic, payload, qos=1)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                # Determine alert level for display
                alert_level = "normal"
                if (
                    reading["methanePpm"] > 1000
                    or reading["co2Ppm"] > 3000
                    or reading["nh3Ppm"] > 25
                ):
                    alert_level = "DANGER"
                elif (
                    reading["methanePpm"] > 500
                    or reading["co2Ppm"] > 2000
                    or reading["nh3Ppm"] > 15
                ):
                    alert_level = "WARNING"

                print(
                    f"[{alert_level:7}] {reading['sensorId']} -> {reading['barnId']}: "
                    f"CH4={reading['methanePpm']:.1f} CO2={reading['co2Ppm']:.1f} "
                    f"NH3={reading['nh3Ppm']:.1f} T={reading['temperature']:.1f}°C "
                    f"H={reading['humidity']:.1f}%"
                )
            else:
                print(f"Failed to publish reading for {sensor['sensorId']}")
        except Exception as e:
            print(f"Error publishing reading: {e}")
            self._send_device_error(sensor_id, f"Publish error: {str(e)}", "MQTT_PUBLISH_FAIL")

    def run(self):
        """Run the simulator continuously"""
        print(f"\nStarting gas sensor simulator...")
        print(f"Publishing readings every {self.interval} seconds")
        print(f"Press Ctrl+C to stop\n")

        try:
            while self.running:
                # Publish readings for all sensors
                for sensor in self.sensors:
                    self.publish_reading(sensor)

                # Wait for next interval
                time.sleep(self.interval)

        except KeyboardInterrupt:
            print("\n\nStopping gas sensor simulator...")
        finally:
            self.disconnect()

    def disconnect(self):
        """Disconnect from the MQTT broker"""
        if self.client:
            # Send offline status for all sensors before disconnecting
            print("\nSending offline status for all sensors...")
            for sensor in self.sensors:
                self._send_device_status(
                    sensor['sensorId'], 
                    'offline', 
                    reason='intentional',
                    message='Simulator shutting down gracefully'
                )
            time.sleep(1)  # Give time for messages to be sent
            
            self.client.loop_stop()
            self.client.disconnect()
            print("Disconnected from MQTT broker")


def main():
    """Main entry point for the gas sensor simulator"""
    # Load configuration from environment
    broker_host = os.getenv("MQTT_BROKER_HOST", "localhost")
    broker_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    num_sensors = int(os.getenv("NUM_GAS_SENSORS", "3"))
    interval = int(os.getenv("GAS_SENSOR_INTERVAL", "10"))

    # Create and run simulator
    simulator = GasSensorSimulator(
        broker_host=broker_host,
        broker_port=broker_port,
        num_sensors=num_sensors,
        interval=interval,
    )

    try:
        simulator.connect()
        simulator.run()
    except Exception as e:
        print(f"Error running simulator: {e}")
        exit(1)


if __name__ == "__main__":
    main()
