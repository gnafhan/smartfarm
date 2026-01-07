/**
 * Arduino Gas Sensor Module (with Ethernet Shield)
 * 
 * Livestock IoT Monitoring System
 * 
 * Hardware:
 * - Arduino Mega 2560 (or Uno with limited features)
 * - Ethernet Shield W5100
 * - MQ-4 (Methane)
 * - MQ-135 (CO2)
 * - MQ-137 (NH3)
 * - DHT22 (Temperature & Humidity)
 * 
 * Note: Arduino Uno has limited memory, use Mega for full features
 * 
 * Author: Livestock Monitoring Team
 * Version: 1.0.0
 */

#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ============================================
// Configuration
// ============================================
// MAC address for Ethernet shield (must be unique)
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

// MQTT Broker
IPAddress mqttServer(192, 168, 1, 100);  // Change to your MQTT broker IP
const int mqttPort = 1883;

// Device Configuration
const char* DEVICE_ID = "GAS-001";
const char* BARN_ID = "BARN-001";

// Pin Configuration
#define MQ4_PIN A0      // Methane sensor
#define MQ135_PIN A1    // CO2 sensor
#define MQ137_PIN A2    // NH3 sensor
#define DHT_PIN 2       // DHT22 sensor
#define DHTTYPE DHT22

// Timing
const unsigned long READING_INTERVAL = 10000;   // 10 seconds
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// ============================================
// Global Objects
// ============================================
EthernetClient ethClient;
PubSubClient mqttClient(ethClient);
DHT dht(DHT_PIN, DHTTYPE);

// Timing variables
unsigned long lastReading = 0;
unsigned long lastHeartbeat = 0;

// Sensor calibration
const float MQ4_R0 = 10.0;
const float MQ135_R0 = 10.0;
const float MQ137_R0 = 10.0;

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ; // Wait for serial port to connect
  }
  
  Serial.println(F("\n================================="));
  Serial.println(F("Arduino Gas Sensor Module"));
  Serial.println(F("Livestock IoT Monitoring System"));
  Serial.println(F("=================================\n"));
  
  // Initialize DHT sensor
  dht.begin();
  
  // Initialize Ethernet
  Serial.println(F("Initializing Ethernet..."));
  if (Ethernet.begin(mac) == 0) {
    Serial.println(F("Failed to configure Ethernet using DHCP"));
    // Try with static IP if DHCP fails
    IPAddress ip(192, 168, 1, 177);
    IPAddress gateway(192, 168, 1, 1);
    IPAddress subnet(255, 255, 255, 0);
    Ethernet.begin(mac, ip, gateway, subnet);
  }
  
  // Print IP address
  Serial.print(F("IP address: "));
  Serial.println(Ethernet.localIP());
  
  // Setup MQTT
  mqttClient.setServer(mqttServer, mqttPort);
  
  // Connect to MQTT
  reconnectMQTT();
  
  // Send online status
  sendDeviceStatus("online");
  
  Serial.println(F("\nSensor warming up... (wait 2 minutes)"));
  delay(120000); // Wait 2 minutes for sensor warm-up
  Serial.println(F("Sensor ready!\n"));
}

void loop() {
  // Maintain Ethernet connection
  Ethernet.maintain();
  
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
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

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print(F("Connecting to MQTT broker..."));
    
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(F(" connected!"));
      sendDeviceStatus("online");
      return;
    } else {
      Serial.print(F(" failed, rc="));
      Serial.print(mqttClient.state());
      Serial.println(F(" retrying in 5 seconds"));
      delay(5000);
    }
  }
}

void readAndPublishSensors() {
  Serial.println(F("Reading sensors..."));
  
  // Read gas sensors
  float methanePpm = readMQ4();
  float co2Ppm = readMQ135();
  float nh3Ppm = readMQ137();
  
  // Read temperature and humidity
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Check for DHT read errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    sendDeviceError("DHT sensor read failed", "DHT_READ_FAIL");
    return;
  }
  
  // Create JSON payload (using smaller buffer for Arduino)
  StaticJsonDocument<256> doc;
  doc["sensorId"] = DEVICE_ID;
  doc["barnId"] = BARN_ID;
  doc["methanePpm"] = (int)(methanePpm * 100) / 100.0;
  doc["co2Ppm"] = (int)(co2Ppm * 100) / 100.0;
  doc["nh3Ppm"] = (int)(nh3Ppm * 100) / 100.0;
  doc["temperature"] = (int)(temperature * 100) / 100.0;
  doc["humidity"] = (int)(humidity * 100) / 100.0;
  doc["timestamp"] = getTimestamp();
  
  // Serialize to string
  char payload[256];
  serializeJson(doc, payload);
  
  // Publish to MQTT
  char topic[64];
  sprintf(topic, "sensors/gas/%s", DEVICE_ID);
  
  if (mqttClient.publish(topic, payload)) {
    Serial.println(F("Published sensor reading:"));
    Serial.print(F("  CH4: ")); Serial.print(methanePpm); Serial.println(F(" ppm"));
    Serial.print(F("  CO2: ")); Serial.print(co2Ppm); Serial.println(F(" ppm"));
    Serial.print(F("  NH3: ")); Serial.print(nh3Ppm); Serial.println(F(" ppm"));
    Serial.print(F("  Temp: ")); Serial.print(temperature); Serial.println(F(" C"));
    Serial.print(F("  Humidity: ")); Serial.print(humidity); Serial.println(F(" %"));
    Serial.println();
  } else {
    Serial.println(F("Failed to publish sensor reading"));
  }
}

float readMQ4() {
  int rawValue = analogRead(MQ4_PIN);
  float voltage = rawValue * (5.0 / 1023.0);
  float rs = ((5.0 * 10.0) / voltage) - 10.0;
  float ratio = rs / MQ4_R0;
  float ppm = 1000.0 * pow(ratio, -1.5);
  return max(0.0, ppm);
}

float readMQ135() {
  int rawValue = analogRead(MQ135_PIN);
  float voltage = rawValue * (5.0 / 1023.0);
  float rs = ((5.0 * 10.0) / voltage) - 10.0;
  float ratio = rs / MQ135_R0;
  float ppm = 1500.0 * pow(ratio, -1.2);
  return max(0.0, ppm);
}

float readMQ137() {
  int rawValue = analogRead(MQ137_PIN);
  float voltage = rawValue * (5.0 / 1023.0);
  float rs = ((5.0 * 10.0) / voltage) - 10.0;
  float ratio = rs / MQ137_R0;
  float ppm = 10.0 * pow(ratio, -1.3);
  return max(0.0, ppm);
}

void sendDeviceStatus(const char* status) {
  StaticJsonDocument<128> doc;
  doc["status"] = status;
  doc["timestamp"] = getTimestamp();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "gas_sensor";
  metadata["version"] = "1.0.0";
  
  char payload[128];
  serializeJson(doc, payload);
  
  char topic[64];
  sprintf(topic, "livestock/devices/%s/status", DEVICE_ID);
  mqttClient.publish(topic, payload, true);
  
  Serial.print(F("Device status: "));
  Serial.println(status);
}

void sendHeartbeat() {
  StaticJsonDocument<64> doc;
  doc["timestamp"] = getTimestamp();
  
  char payload[64];
  serializeJson(doc, payload);
  
  char topic[64];
  sprintf(topic, "livestock/devices/%s/heartbeat", DEVICE_ID);
  
  if (mqttClient.publish(topic, payload)) {
    Serial.println(F("Heartbeat sent"));
  }
}

void sendDeviceError(const char* errorMsg, const char* errorCode) {
  StaticJsonDocument<128> doc;
  doc["error"] = errorMsg;
  doc["errorCode"] = errorCode;
  doc["message"] = errorMsg;
  doc["timestamp"] = getTimestamp();
  
  char payload[128];
  serializeJson(doc, payload);
  
  char topic[64];
  sprintf(topic, "livestock/devices/%s/error", DEVICE_ID);
  mqttClient.publish(topic, payload);
  
  Serial.print(F("Error: "));
  Serial.println(errorMsg);
}

const char* getTimestamp() {
  // Simple timestamp based on millis()
  // In production, use RTC or NTP
  static char timestamp[32];
  unsigned long seconds = millis() / 1000;
  sprintf(timestamp, "2024-01-07T%02lu:%02lu:%02luZ", 
          (seconds / 3600) % 24, 
          (seconds / 60) % 60, 
          seconds % 60);
  return timestamp;
}
