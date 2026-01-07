#!/usr/bin/env python3
"""
RFID Reader Simulator for Livestock IoT Monitoring System

Simulates RFID readers sending entry/exit events to the backend API.
Fetches actual livestock and barn data from the backend.

Requirements: Simulator for testing
Task: 28.2 - Implement RFID reader simulator
"""

import json
import random
import time
import os
from datetime import datetime, timezone
from typing import List, Dict, Optional
import requests
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class RFIDReaderSimulator:
    """Simulates RFID readers tracking livestock entry/exit events"""

    def __init__(
        self,
        backend_url: str = "http://localhost:3001",
        interval: int = 30,
        mqtt_broker: str = "localhost",
        mqtt_port: int = 1883,
    ):
        """
        Initialize the RFID reader simulator
        
        Args:
            backend_url: Backend API base URL
            interval: Seconds between RFID events
            mqtt_broker: MQTT broker hostname
            mqtt_port: MQTT broker port
        """
        self.backend_url = backend_url.rstrip("/")
        self.interval = interval
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        self.mqtt_client = None
        self.running = False
        self.auth_token: Optional[str] = None
        self.heartbeat_interval = 30
        self.last_heartbeat = {}
        self.error_probability = 0.01  # 1% chance of error

        # Data fetched from backend
        self.livestock_ids: List[str] = []
        self.barn_ids: List[str] = []
        
        # Sample RFID reader IDs
        self.reader_ids: List[str] = [
            "RFID-READER-001",
            "RFID-READER-002",
            "RFID-READER-003",
        ]

        # Track current location of each livestock
        self.livestock_locations: Dict[str, Optional[str]] = {}

    def _authenticate(self) -> bool:
        """
        Authenticate with the backend to get JWT token
        
        Returns:
            True if authentication successful, False otherwise
        """
        try:
            # Use default admin credentials
            login_data = {
                "email": os.getenv("ADMIN_EMAIL", "admin@livestock.com"),
                "password": os.getenv("ADMIN_PASSWORD", "admin123"),
            }
            
            response = requests.post(
                f"{self.backend_url}/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                self.auth_token = data.get("access_token") or data.get("accessToken")
                if self.auth_token:
                    print("Authentication successful")
                    return True
                else:
                    print(f"No token in response: {data}")
                    return False
            else:
                print(f"Authentication failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"Authentication error: {e}")
            return False

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get headers with authentication token"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    def _fetch_livestock(self) -> bool:
        """
        Fetch livestock IDs from the backend
        
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.get(
                f"{self.backend_url}/api/livestock",
                headers=self._get_auth_headers(),
                timeout=10,
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("data") or data.get("items") or []
                self.livestock_ids = [item["id"] for item in items if "id" in item]
                
                # Initialize locations
                for livestock_id in self.livestock_ids:
                    self.livestock_locations[livestock_id] = None
                    
                print(f"Fetched {len(self.livestock_ids)} livestock")
                return len(self.livestock_ids) > 0
            else:
                print(f"Failed to fetch livestock: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"Error fetching livestock: {e}")
            return False

    def _fetch_barns(self) -> bool:
        """
        Fetch barn IDs from the backend
        
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.get(
                f"{self.backend_url}/api/barns",
                headers=self._get_auth_headers(),
                timeout=10,
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("data") or data.get("items") or []
                self.barn_ids = [item["id"] for item in items if "id" in item]
                print(f"Fetched {len(self.barn_ids)} barns")
                return len(self.barn_ids) > 0
            else:
                print(f"Failed to fetch barns: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"Error fetching barns: {e}")
            return False

    def _initialize_data(self) -> bool:
        """
        Initialize data by fetching from backend
        
        Returns:
            True if successful, False otherwise
        """
        print("\nInitializing RFID simulator...")
        
        # Authenticate first
        if not self._authenticate():
            print("Warning: Running without authentication")
        
        # Fetch livestock and barns
        livestock_ok = self._fetch_livestock()
        barns_ok = self._fetch_barns()
        
        if not livestock_ok:
            print("Error: No livestock found. Please create livestock first.")
            return False
            
        if not barns_ok:
            print("Error: No barns found. Please create barns first.")
            return False
        
        # Connect to MQTT
        self._connect_mqtt()
        
        print(f"\nInitialized RFID simulator:")
        print(f"  - {len(self.livestock_ids)} livestock")
        print(f"  - {len(self.barn_ids)} barns")
        print(f"  - {len(self.reader_ids)} RFID readers")
        
        return True

    def _connect_mqtt(self):
        """Connect to MQTT broker for device management"""
        try:
            self.mqtt_client = mqtt.Client(
                client_id=f"rfid-simulator-{int(time.time())}"
            )
            self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, keepalive=60)
            self.mqtt_client.loop_start()
            
            # Send online status for all readers
            time.sleep(1)  # Wait for connection
            for reader_id in self.reader_ids:
                self._send_device_status(reader_id, 'online')
                
            print(f"Connected to MQTT broker at {self.mqtt_broker}:{self.mqtt_port}")
        except Exception as e:
            print(f"Warning: Could not connect to MQTT broker: {e}")
            self.mqtt_client = None

    def _send_device_status(self, device_id: str, status: str, reason: str = None, message: str = None):
        """Send device status update via MQTT"""
        if not self.mqtt_client:
            return
            
        topic = f"livestock/devices/{device_id}/status"
        payload = {
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "metadata": {
                "type": "rfid_reader",
                "version": "1.0.0"
            }
        }
        
        if reason:
            payload["reason"] = reason
        if message:
            payload["message"] = message
            
        try:
            self.mqtt_client.publish(topic, json.dumps(payload), qos=1)
        except Exception as e:
            print(f"Error sending device status: {e}")

    def _send_heartbeat(self, device_id: str):
        """Send device heartbeat via MQTT"""
        if not self.mqtt_client:
            return
            
        topic = f"livestock/devices/{device_id}/heartbeat"
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        
        try:
            self.mqtt_client.publish(topic, json.dumps(payload), qos=0)
            self.last_heartbeat[device_id] = time.time()
        except Exception as e:
            print(f"Error sending heartbeat: {e}")

    def _send_device_error(self, device_id: str, error: str, error_code: str = None):
        """Send device error via MQTT"""
        if not self.mqtt_client:
            return
            
        topic = f"livestock/devices/{device_id}/error"
        payload = {
            "error": error,
            "message": error,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "metadata": {
                "type": "rfid_reader"
            }
        }
        
        if error_code:
            payload["errorCode"] = error_code
            
        try:
            self.mqtt_client.publish(topic, json.dumps(payload), qos=1)
            print(f"[ERROR] {device_id}: {error}")
        except Exception as e:
            print(f"Error sending device error: {e}")

    def _generate_event(self) -> Dict:
        """
        Generate a realistic RFID event
        
        Returns:
            Event dictionary with livestock, barn, event type, and reader
        """
        # Select a random livestock
        livestock_id = random.choice(self.livestock_ids)
        current_location = self.livestock_locations.get(livestock_id)

        # Determine event type based on current location
        if current_location is None:
            # Livestock is outside - generate entry event
            event_type = "entry"
            barn_id = random.choice(self.barn_ids)
        else:
            # Livestock is inside - generate exit event
            event_type = "exit"
            barn_id = current_location

        # Select a random reader
        reader_id = random.choice(self.reader_ids)

        event = {
            "livestockId": livestock_id,
            "barnId": barn_id,
            "eventType": event_type,
            "rfidReaderId": reader_id,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

        return event

    def _send_event(self, event: Dict) -> bool:
        """
        Send an RFID event to the backend API
        
        Args:
            event: Event dictionary
            
        Returns:
            True if successful, False otherwise
        """
        reader_id = event['rfidReaderId']
        
        # Send heartbeat if needed
        current_time = time.time()
        last_hb = self.last_heartbeat.get(reader_id, 0)
        if current_time - last_hb >= self.heartbeat_interval:
            self._send_heartbeat(reader_id)
        
        # Simulate random errors
        if random.random() < self.error_probability:
            error_types = [
                ("RFID_READ_FAIL", "Failed to read RFID tag"),
                ("RFID_ANTENNA_ERROR", "Antenna malfunction"),
                ("RFID_TAG_CORRUPT", "Corrupted tag data"),
                ("RFID_TIMEOUT", "Read timeout"),
            ]
            error_code, error_msg = random.choice(error_types)
            self._send_device_error(reader_id, error_msg, error_code)
            return False
        
        url = f"{self.backend_url}/api/logs"

        try:
            response = requests.post(
                url,
                json=event,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )

            if response.status_code in [200, 201]:
                # Update livestock location tracking
                if event["eventType"] == "entry":
                    self.livestock_locations[event["livestockId"]] = event["barnId"]
                else:  # exit
                    self.livestock_locations[event["livestockId"]] = None

                print(
                    f"[{event['eventType'].upper():5}] {event['livestockId'][:8]}... "
                    f"{'→' if event['eventType'] == 'entry' else '←'} {event['barnId'][:8]}... "
                    f"(Reader: {event['rfidReaderId']})"
                )
                return True
            else:
                print(
                    f"Failed to send event: HTTP {response.status_code} - {response.text}"
                )
                return False

        except requests.exceptions.ConnectionError:
            print(f"Error: Cannot connect to backend at {self.backend_url}")
            self._send_device_error(reader_id, "Backend connection error", "NETWORK_ERROR")
            return False
        except requests.exceptions.Timeout:
            print(f"Error: Request timeout to {url}")
            self._send_device_error(reader_id, "Request timeout", "TIMEOUT_ERROR")
            return False
        except Exception as e:
            print(f"Error sending event: {e}")
            self._send_device_error(reader_id, f"Send error: {str(e)}", "SEND_ERROR")
            return False

    def test_connection(self) -> bool:
        """
        Test connection to the backend API
        
        Returns:
            True if backend is reachable, False otherwise
        """
        try:
            response = requests.get(f"{self.backend_url}/", timeout=5)
            return True
        except:
            return False

    def run(self):
        """Run the simulator continuously"""
        print(f"\nStarting RFID reader simulator...")
        print(f"Backend API: {self.backend_url}")
        print(f"Generating events every {self.interval} seconds")
        
        # Test connection first
        print("\nTesting connection to backend...")
        if not self.test_connection():
            print(f"Error: Cannot connect to backend at {self.backend_url}")
            print("Make sure the backend server is running")
            return
        
        print("Backend connection successful")
        
        # Initialize data from backend
        if not self._initialize_data():
            print("Failed to initialize. Exiting.")
            return
        
        print("\nPress Ctrl+C to stop\n")

        self.running = True

        try:
            while self.running:
                event = self._generate_event()
                self._send_event(event)
                time.sleep(self.interval)

        except KeyboardInterrupt:
            print("\n\nStopping RFID reader simulator...")
        finally:
            self.running = False
            # Send offline status for all readers
            if self.mqtt_client:
                print("Sending offline status for all readers...")
                for reader_id in self.reader_ids:
                    self._send_device_status(
                        reader_id,
                        'offline',
                        reason='intentional',
                        message='Simulator shutting down gracefully'
                    )
                time.sleep(1)
                self.mqtt_client.loop_stop()
                self.mqtt_client.disconnect()

    def run_batch(self, num_events: int = 10):
        """
        Run a batch of events for testing
        
        Args:
            num_events: Number of events to generate
        """
        print(f"\nGenerating {num_events} RFID events...")
        print(f"Backend API: {self.backend_url}")
        
        # Initialize data from backend
        if not self._initialize_data():
            print("Failed to initialize. Exiting.")
            return

        print()
        success_count = 0
        for i in range(num_events):
            event = self._generate_event()
            if self._send_event(event):
                success_count += 1
            time.sleep(1)  # Small delay between events

        print(f"\nCompleted: {success_count}/{num_events} events sent successfully")


def main():
    """Main entry point for the RFID reader simulator"""
    # Load configuration from environment
    backend_url = os.getenv("BACKEND_API_URL", "http://localhost:3001")
    interval = int(os.getenv("RFID_EVENT_INTERVAL", "30"))
    mqtt_broker = os.getenv("MQTT_BROKER_HOST", "localhost")
    mqtt_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))

    # Create simulator
    simulator = RFIDReaderSimulator(
        backend_url=backend_url,
        interval=interval,
        mqtt_broker=mqtt_broker,
        mqtt_port=mqtt_port,
    )

    # Check for batch mode
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--batch":
        num_events = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        simulator.run_batch(num_events)
    else:
        simulator.run()


if __name__ == "__main__":
    main()
