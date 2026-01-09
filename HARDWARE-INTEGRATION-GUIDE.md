# Hardware Integration Guide - Production Environment

Panduan integrasi untuk developer hardware (ESP32, Arduino, dll) untuk connect ke sistem Livestock Monitoring Production.

## 📡 Server Configuration

### Production URLs
- **MQTT Broker**: `mqtt-livestock.nafhan.com` (Port: `1883`)
- **Backend API**: `https://api-livestock.nafhan.com`
- **Frontend Dashboard**: `https://livestock.nafhan.com`

### Alternative Connection (Jika DNS Belum Propagate)
- **MQTT Broker IP**: `31.97.223.172` (Port: `1883`)
- **Backend API**: `https://api-livestock.nafhan.com`

---

## 🔌 MQTT Connection

### Connection Parameters
```cpp
// ESP32/Arduino Configuration
const char* mqtt_server = "mqtt-livestock.nafhan.com";  // atau "31.97.223.172"
const int mqtt_port = 1883;
const char* client_id = "GAS-001";  // Unique device ID
```

### Connection Example (ESP32)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  // WiFi setup
  WiFi.begin(ssid, password);
  
  // MQTT setup
  client.setServer("mqtt-livestock.nafhan.com", 1883);
  client.setCallback(callback);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("GAS-001")) {
      Serial.println("connected");
      // Send online status
      sendDeviceStatus("online");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}
```

---

## 📤 MQTT Topics & Payloads

### 1. Gas Sensor Readings

**Topic**: `sensors/gas/{sensorId}`

**Payload Structure**:
```json
{
  "sensorId": "GAS-001",
  "barnId": "BARN-001",
  "methanePpm": 350.50,
  "co2Ppm": 1200.75,
  "nh3Ppm": 8.25,
  "temperature": 23.5,
  "humidity": 65.2,
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

**Field Descriptions**:
- `sensorId` (string, required): Unique sensor identifier (e.g., "GAS-001", "GAS-002")
- `barnId` (string, required): Barn identifier where sensor is located
- `methanePpm` (float, required): Methane level in PPM (0-5000)
- `co2Ppm` (float, required): CO2 level in PPM (0-10000)
- `nh3Ppm` (float, required): Ammonia level in PPM (0-100)
- `temperature` (float, required): Temperature in Celsius (-20 to 60)
- `humidity` (float, required): Humidity percentage (0-100)
- `timestamp` (string, required): ISO 8601 format UTC timestamp

**Alert Thresholds**:
- **Normal**: CH4 < 500, CO2 < 2000, NH3 < 15
- **Warning**: CH4 500-1000, CO2 2000-3000, NH3 15-25
- **Danger**: CH4 > 1000, CO2 > 3000, NH3 > 25

**Example (ESP32)**:
```cpp
void publishGasReading() {
  StaticJsonDocument<256> doc;
  doc["sensorId"] = "GAS-001";
  doc["barnId"] = "BARN-001";
  doc["methanePpm"] = readMethane();
  doc["co2Ppm"] = readCO2();
  doc["nh3Ppm"] = readNH3();
  doc["temperature"] = readTemperature();
  doc["humidity"] = readHumidity();
  doc["timestamp"] = getISOTimestamp();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  client.publish("sensors/gas/GAS-001", buffer, true);
}
```

---

### 2. Device Status

**Topic**: `livestock/devices/{deviceId}/status`

**Payload Structure**:
```json
{
  "status": "online",
  "timestamp": "2026-01-08T10:30:00.000Z",
  "metadata": {
    "type": "gas_sensor",
    "version": "1.0.0"
  },
  "reason": "intentional",
  "message": "Device started successfully"
}
```

**Field Descriptions**:
- `status` (string, required): Device status
  - `"online"` - Device connected and operational
  - `"offline"` - Device disconnected
  - `"connected"` - Device just connected
  - `"disconnected"` - Device just disconnected
- `timestamp` (string, required): ISO 8601 format UTC timestamp
- `metadata` (object, required):
  - `type` (string): Device type ("gas_sensor", "rfid_reader", etc.)
  - `version` (string): Firmware version
- `reason` (string, optional): Disconnect reason
  - `"intentional"` - Planned shutdown
  - `"timeout"` - Connection timeout
  - `"error"` - Error occurred
  - `"network"` - Network issue
- `message` (string, optional): Additional information

**When to Send**:
- On device startup → `status: "online"`
- On device shutdown → `status: "offline"` with `reason: "intentional"`
- On connection lost → `status: "disconnected"` with appropriate reason
- On reconnection → `status: "connected"`

**Example (ESP32)**:
```cpp
void sendDeviceStatus(const char* status, const char* reason = NULL) {
  StaticJsonDocument<256> doc;
  doc["status"] = status;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "gas_sensor";
  metadata["version"] = "1.0.0";
  
  if (reason != NULL) {
    doc["reason"] = reason;
  }
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  client.publish("livestock/devices/GAS-001/status", buffer, true);
}

// Usage
void setup() {
  // ... WiFi and MQTT setup ...
  sendDeviceStatus("online");
}

void loop() {
  if (!client.connected()) {
    sendDeviceStatus("disconnected", "timeout");
    reconnect();
  }
}
```

---

### 3. Device Heartbeat

**Topic**: `livestock/devices/{deviceId}/heartbeat`

**Payload Structure**:
```json
{
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

**Field Descriptions**:
- `timestamp` (string, required): ISO 8601 format UTC timestamp

**Frequency**: Send every 30 seconds to indicate device is alive

**Example (ESP32)**:
```cpp
unsigned long lastHeartbeat = 0;
const long heartbeatInterval = 30000; // 30 seconds

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = currentMillis;
    sendHeartbeat();
  }
}

void sendHeartbeat() {
  StaticJsonDocument<64> doc;
  doc["timestamp"] = getISOTimestamp();
  
  char buffer[64];
  serializeJson(doc, buffer);
  
  client.publish("livestock/devices/GAS-001/heartbeat", buffer, false);
}
```

---

### 4. Device Error

**Topic**: `livestock/devices/{deviceId}/error`

**Payload Structure**:
```json
{
  "error": "Failed to read sensor data",
  "message": "Failed to read sensor data",
  "timestamp": "2026-01-08T10:30:00.000Z",
  "metadata": {
    "type": "gas_sensor"
  },
  "errorCode": "SENSOR_READ_FAIL"
}
```

**Field Descriptions**:
- `error` (string, required): Error message
- `message` (string, required): Detailed error message
- `timestamp` (string, required): ISO 8601 format UTC timestamp
- `metadata` (object, required):
  - `type` (string): Device type
- `errorCode` (string, optional): Error code for categorization

**Common Error Codes**:
- `SENSOR_READ_FAIL` - Failed to read sensor data
- `SENSOR_CALIBRATION` - Sensor calibration error
- `SENSOR_TIMEOUT` - Sensor read timeout
- `SENSOR_MALFUNCTION` - Sensor malfunction detected
- `MQTT_PUBLISH_FAIL` - Failed to publish to MQTT
- `NETWORK_ERROR` - Network connection error
- `MEMORY_ERROR` - Memory allocation error

**Example (ESP32)**:
```cpp
void sendDeviceError(const char* errorMsg, const char* errorCode = NULL) {
  StaticJsonDocument<256> doc;
  doc["error"] = errorMsg;
  doc["message"] = errorMsg;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "gas_sensor";
  
  if (errorCode != NULL) {
    doc["errorCode"] = errorCode;
  }
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  client.publish("livestock/devices/GAS-001/error", buffer, true);
  
  Serial.print("ERROR: ");
  Serial.println(errorMsg);
}

// Usage
float readSensor() {
  float value = analogRead(SENSOR_PIN);
  if (value < 0 || value > 4095) {
    sendDeviceError("Sensor reading out of range", "SENSOR_READ_FAIL");
    return -1;
  }
  return value;
}
```

---

## 🌐 HTTP API Endpoints

### Base URL
```
https://api-livestock.nafhan.com
```

### 1. Device Registration

**Endpoint**: `POST /api/devices/register`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "deviceId": "GAS-001",
  "type": "gas_sensor",
  "name": "Gas Sensor 1",
  "location": "Barn A - Section 1",
  "barnId": "BARN-001",
  "metadata": {
    "model": "MQ-4",
    "firmwareVersion": "1.0.0",
    "macAddress": "AA:BB:CC:DD:EE:FF"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "deviceId": "GAS-001",
    "type": "gas_sensor",
    "status": "active",
    "createdAt": "2026-01-08T10:30:00.000Z"
  }
}
```

**Example (ESP32)**:
```cpp
#include <HTTPClient.h>

void registerDevice() {
  HTTPClient http;
  http.begin("https://api-livestock.nafhan.com/api/devices/register");
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<512> doc;
  doc["deviceId"] = "GAS-001";
  doc["type"] = "gas_sensor";
  doc["name"] = "Gas Sensor 1";
  doc["location"] = "Barn A - Section 1";
  doc["barnId"] = "BARN-001";
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["model"] = "MQ-4";
  metadata["firmwareVersion"] = "1.0.0";
  metadata["macAddress"] = WiFi.macAddress();
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  
  if (httpCode == 201) {
    Serial.println("Device registered successfully");
  } else {
    Serial.printf("Registration failed: %d\n", httpCode);
  }
  
  http.end();
}
```

---

## 🔧 Complete ESP32 Example

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "mqtt-livestock.nafhan.com";
const int mqtt_port = 1883;
const char* device_id = "GAS-001";
const char* barn_id = "BARN-001";

// Timing
unsigned long lastReading = 0;
unsigned long lastHeartbeat = 0;
const long readingInterval = 10000;  // 10 seconds
const long heartbeatInterval = 30000; // 30 seconds

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  
  // Configure time
  configTime(0, 0, "pool.ntp.org");
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  
  // Initial connection
  reconnect();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  unsigned long currentMillis = millis();
  
  // Send sensor reading
  if (currentMillis - lastReading >= readingInterval) {
    lastReading = currentMillis;
    publishGasReading();
  }
  
  // Send heartbeat
  if (currentMillis - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = currentMillis;
    sendHeartbeat();
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect(device_id)) {
      Serial.println("connected");
      sendDeviceStatus("online");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void publishGasReading() {
  StaticJsonDocument<256> doc;
  doc["sensorId"] = device_id;
  doc["barnId"] = barn_id;
  doc["methanePpm"] = readMethane();
  doc["co2Ppm"] = readCO2();
  doc["nh3Ppm"] = readNH3();
  doc["temperature"] = readTemperature();
  doc["humidity"] = readHumidity();
  doc["timestamp"] = getISOTimestamp();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  char topic[64];
  sprintf(topic, "sensors/gas/%s", device_id);
  
  if (client.publish(topic, buffer, true)) {
    Serial.println("Reading published");
  } else {
    sendDeviceError("Failed to publish reading", "MQTT_PUBLISH_FAIL");
  }
}

void sendDeviceStatus(const char* status) {
  StaticJsonDocument<256> doc;
  doc["status"] = status;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "gas_sensor";
  metadata["version"] = "1.0.0";
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  char topic[64];
  sprintf(topic, "livestock/devices/%s/status", device_id);
  client.publish(topic, buffer, true);
}

void sendHeartbeat() {
  StaticJsonDocument<64> doc;
  doc["timestamp"] = getISOTimestamp();
  
  char buffer[64];
  serializeJson(doc, buffer);
  
  char topic[64];
  sprintf(topic, "livestock/devices/%s/heartbeat", device_id);
  client.publish(topic, buffer, false);
}

void sendDeviceError(const char* errorMsg, const char* errorCode) {
  StaticJsonDocument<256> doc;
  doc["error"] = errorMsg;
  doc["message"] = errorMsg;
  doc["timestamp"] = getISOTimestamp();
  doc["errorCode"] = errorCode;
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "gas_sensor";
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  char topic[64];
  sprintf(topic, "livestock/devices/%s/error", device_id);
  client.publish(topic, buffer, true);
}

String getISOTimestamp() {
  time_t now;
  struct tm timeinfo;
  time(&now);
  gmtime_r(&now, &timeinfo);
  
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S.000Z", &timeinfo);
  return String(buffer);
}

// Sensor reading functions (implement based on your hardware)
float readMethane() { return random(200, 500) / 1.0; }
float readCO2() { return random(800, 1500) / 1.0; }
float readNH3() { return random(5, 15) / 1.0; }
float readTemperature() { return random(20, 30) / 1.0; }
float readHumidity() { return random(50, 70) / 1.0; }
```

---

## 📋 Testing Checklist

- [ ] Device dapat connect ke WiFi
- [ ] Device dapat connect ke MQTT broker
- [ ] Device mengirim status "online" saat startup
- [ ] Device mengirim sensor readings setiap 10 detik
- [ ] Device mengirim heartbeat setiap 30 detik
- [ ] Device mengirim error jika ada masalah
- [ ] Device mengirim status "offline" saat shutdown
- [ ] Data muncul di dashboard `https://livestock.nafhan.com`
- [ ] Alert muncul jika nilai melebihi threshold

---

## 🐛 Troubleshooting

### MQTT Connection Failed
```
Error: Connection refused (errno 61)
```
**Solution**: 
- Cek DNS: `ping mqtt-livestock.nafhan.com`
- Gunakan IP jika DNS belum propagate: `31.97.223.172`
- Cek firewall: Port 1883 harus terbuka

### Data Tidak Muncul di Dashboard
**Solution**:
- Cek format JSON payload (harus sesuai struktur)
- Cek topic MQTT (harus sesuai format)
- Cek timestamp (harus ISO 8601 UTC)
- Cek device sudah register di sistem

### Sensor Reading Error
**Solution**:
- Kirim error message via MQTT topic `livestock/devices/{deviceId}/error`
- Cek koneksi sensor hardware
- Cek kalibrasi sensor

---

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Cek logs di dashboard: `https://livestock.nafhan.com/devices`
2. Monitor MQTT messages: `mosquitto_sub -h mqtt-livestock.nafhan.com -t "#" -v`
3. Cek API health: `https://api-livestock.nafhan.com/`

---

**Last Updated**: January 8, 2026  
**Version**: 1.0.0  
**Environment**: Production
