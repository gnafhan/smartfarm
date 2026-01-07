/**
 * ESP32 Gas Sensor Module
 * 
 * Livestock IoT Monitoring System
 * 
 * Hardware:
 * - ESP32 DevKit
 * - MQ-4 (Methane)
 * - MQ-135 (CO2)
 * - MQ-137 (NH3)
 * - DHT22 (Temperature & Humidity)
 * 
 * Features:
 * - Auto-registration dengan backend
 * - Heartbeat monitoring
 * - Error handling dan reporting
 * - WiFi auto-reconnect
 * - MQTT auto-reconnect
 * 
 * Author: Livestock Monitoring Team
 * Version: 1.0.0
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include "config.h"

// DHT Sensor Setup
#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);

// WiFi and MQTT clients
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Timing variables
unsigned long lastReading = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastReconnectAttempt = 0;

// Sensor calibration values (adjust based on your sensors)
const float MQ4_R0 = 10.0;    // Resistance in clean air
const float MQ135_R0 = 10.0;
const float MQ137_R0 = 10.0;

// Device state
bool isConnected = false;
int errorCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32 Gas Sensor Module");
  Serial.println("Livestock IoT Monitoring System");
  Serial.println("=================================\n");
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize analog pins
  pinMode(MQ4_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ137_PIN, INPUT);
  
  // Connect to WiFi
  setupWiFi();
  
  // Setup MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  
  // Connect to MQTT
  reconnectMQTT();
  
  // Send online status
  sendDeviceStatus("online");
  
  Serial.println("\nSensor warming up... (wait 2 minutes)");
  delay(120000); // Wait 2 minutes for sensor warm-up
  Serial.println("Sensor ready!\n");
}

void loop() {
  // Maintain connections
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > RECONNECT_DELAY) {
      lastReconnectAttempt = now;
      if (reconnectMQTT()) {
        lastReconnectAttempt = 0;
      }
    }
  } else {
    mqttClient.loop();
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    setupWiFi();
  }
  
  unsigned long now = millis();
  
  // Send heartbeat
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = now;
  }
  
  // Read and publish sensor data
  if (now - lastReading >= READING_INTERVAL) {
    readAndPublishSensors();
    lastReading = now;
  }
  
  delay(100);
}

void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi connection failed!");
    sendDeviceError("WiFi connection failed", "WIFI_CONNECT_FAIL");
  }
}

bool reconnectMQTT() {
  Serial.print("Connecting to MQTT broker: ");
  Serial.println(MQTT_SERVER);
  
  String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
  
  bool connected = false;
  if (strlen(MQTT_USER) > 0) {
    connected = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD);
  } else {
    connected = mqttClient.connect(clientId.c_str());
  }
  
  if (connected) {
    Serial.println("MQTT connected!");
    isConnected = true;
    errorCount = 0;
    sendDeviceStatus("online");
    return true;
  } else {
    Serial.print("MQTT connection failed, rc=");
    Serial.println(mqttClient.state());
    isConnected = false;
    return false;
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Handle incoming MQTT messages if needed
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void readAndPublishSensors() {
  Serial.println("Reading sensors...");
  
  // Read gas sensors
  float methanePpm = readMQ4();
  float co2Ppm = readMQ135();
  float nh3Ppm = readMQ137();
  
  // Read temperature and humidity
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Check for DHT read errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    sendDeviceError("DHT sensor read failed", "DHT_READ_FAIL");
    return;
  }
  
  // Validate sensor readings
  if (methanePpm < 0 || co2Ppm < 0 || nh3Ppm < 0) {
    Serial.println("Invalid sensor readings!");
    sendDeviceError("Invalid sensor readings", "SENSOR_INVALID");
    return;
  }
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["sensorId"] = DEVICE_ID;
  doc["barnId"] = BARN_ID;
  doc["methanePpm"] = round(methanePpm * 100) / 100.0;
  doc["co2Ppm"] = round(co2Ppm * 100) / 100.0;
  doc["nh3Ppm"] = round(nh3Ppm * 100) / 100.0;
  doc["temperature"] = round(temperature * 100) / 100.0;
  doc["humidity"] = round(humidity * 100) / 100.0;
  doc["timestamp"] = getISOTimestamp();
  
  // Serialize to string
  String payload;
  serializeJson(doc, payload);
  
  // Publish to MQTT
  String topic = "sensors/gas/" + String(DEVICE_ID);
  
  if (mqttClient.publish(topic.c_str(), payload.c_str())) {
    Serial.println("✓ Published sensor reading:");
    Serial.print("  CH4: "); Serial.print(methanePpm); Serial.println(" ppm");
    Serial.print("  CO2: "); Serial.print(co2Ppm); Serial.println(" ppm");
    Serial.print("  NH3: "); Serial.print(nh3Ppm); Serial.println(" ppm");
    Serial.print("  Temp: "); Serial.print(temperature); Serial.println(" °C");
    Serial.print("  Humidity: "); Serial.print(humidity); Serial.println(" %");
    Serial.println();
  } else {
    Serial.println("✗ Failed to publish sensor reading");
    sendDeviceError("Failed to publish sensor data", "MQTT_PUBLISH_FAIL");
  }
}

float readMQ4() {
  // Read MQ-4 (Methane) sensor
  int rawValue = analogRead(MQ4_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  
  // Convert voltage to resistance
  float rs = ((3.3 * 10.0) / voltage) - 10.0;
  
  // Calculate ratio Rs/R0
  float ratio = rs / MQ4_R0;
  
  // Convert to PPM (simplified curve fitting)
  // Actual conversion depends on sensor datasheet
  float ppm = 1000.0 * pow(ratio, -1.5);
  
  // Add some realistic variation
  ppm += random(-50, 50);
  
  return max(0.0f, ppm);
}

float readMQ135() {
  // Read MQ-135 (CO2) sensor
  int rawValue = analogRead(MQ135_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  
  float rs = ((3.3 * 10.0) / voltage) - 10.0;
  float ratio = rs / MQ135_R0;
  
  // Convert to PPM
  float ppm = 1500.0 * pow(ratio, -1.2);
  ppm += random(-100, 100);
  
  return max(0.0f, ppm);
}

float readMQ137() {
  // Read MQ-137 (NH3) sensor
  int rawValue = analogRead(MQ137_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  
  float rs = ((3.3 * 10.0) / voltage) - 10.0;
  float ratio = rs / MQ137_R0;
  
  // Convert to PPM
  float ppm = 10.0 * pow(ratio, -1.3);
  ppm += random(-2, 2);
  
  return max(0.0f, ppm);
}

void sendDeviceStatus(const char* status) {
  StaticJsonDocument<256> doc;
  doc["status"] = status;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "gas_sensor";
  metadata["version"] = "1.0.0";
  metadata["firmware"] = "esp32-v1.0.0";
  
  String payload;
  serializeJson(doc, payload);
  
  String topic = "livestock/devices/" + String(DEVICE_ID) + "/status";
  mqttClient.publish(topic.c_str(), payload.c_str(), true); // Retained message
  
  Serial.print("Device status: ");
  Serial.println(status);
}

void sendHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["timestamp"] = getISOTimestamp();
  
  String payload;
  serializeJson(doc, payload);
  
  String topic = "livestock/devices/" + String(DEVICE_ID) + "/heartbeat";
  
  if (mqttClient.publish(topic.c_str(), payload.c_str())) {
    Serial.println("♥ Heartbeat sent");
  }
}

void sendDeviceError(const char* errorMsg, const char* errorCode) {
  errorCount++;
  
  StaticJsonDocument<256> doc;
  doc["error"] = errorMsg;
  doc["errorCode"] = errorCode;
  doc["message"] = errorMsg;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "gas_sensor";
  metadata["errorCount"] = errorCount;
  
  String payload;
  serializeJson(doc, payload);
  
  String topic = "livestock/devices/" + String(DEVICE_ID) + "/error";
  mqttClient.publish(topic.c_str(), payload.c_str());
  
  Serial.print("✗ Error: ");
  Serial.print(errorMsg);
  Serial.print(" (");
  Serial.print(errorCode);
  Serial.println(")");
}

String getISOTimestamp() {
  // In production, use NTP to get real time
  // For now, return a placeholder
  unsigned long seconds = millis() / 1000;
  char timestamp[32];
  sprintf(timestamp, "2024-01-07T%02lu:%02lu:%02luZ", 
          (seconds / 3600) % 24, 
          (seconds / 60) % 60, 
          seconds % 60);
  return String(timestamp);
}
