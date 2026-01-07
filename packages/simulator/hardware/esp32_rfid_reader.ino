/**
 * ESP32 RFID Reader Module
 * 
 * Livestock IoT Monitoring System
 * 
 * Hardware:
 * - ESP32 DevKit
 * - MFRC522 RFID Reader
 * - Green LED (success)
 * - Red LED (error)
 * - Buzzer (feedback)
 * 
 * Features:
 * - RFID tag reading
 * - HTTP API integration
 * - Auto-registration dengan backend
 * - Visual dan audio feedback
 * - Error handling
 * 
 * Author: Livestock Monitoring Team
 * Version: 1.0.0
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include "config.h"

// MFRC522 Setup
MFRC522 mfrc522(RFID_SDA_PIN, RFID_RST_PIN);

// WiFi and MQTT clients
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// HTTP client for API calls
HTTPClient http;

// Timing variables
unsigned long lastHeartbeat = 0;
unsigned long lastReconnectAttempt = 0;

// Device state
bool isConnected = false;
int errorCount = 0;
String lastScannedTag = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN = 3000; // 3 seconds between same tag scans

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32 RFID Reader Module");
  Serial.println("Livestock IoT Monitoring System");
  Serial.println("=================================\n");
  
  // Initialize SPI
  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SDA_PIN);
  
  // Initialize MFRC522
  mfrc522.PCD_Init();
  delay(100);
  
  // Check MFRC522 version
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print("MFRC522 Version: 0x");
  Serial.println(version, HEX);
  
  if (version == 0x00 || version == 0xFF) {
    Serial.println("✗ MFRC522 not detected! Check wiring.");
    while (1); // Halt
  }
  
  // Set antenna gain to maximum
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  
  // Initialize LED and Buzzer pins
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Test LEDs and buzzer
  testIndicators();
  
  // Connect to WiFi
  setupWiFi();
  
  // Setup MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  
  // Connect to MQTT
  reconnectMQTT();
  
  // Send online status
  sendDeviceStatus("online");
  
  Serial.println("\nRFID Reader ready! Waiting for tags...\n");
}

void loop() {
  // Maintain MQTT connection
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
  
  // Check for RFID tags
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    handleRFIDTag();
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
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
    blinkRed(3);
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

void handleRFIDTag() {
  // Get tag UID
  String tagUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) {
      tagUID += "0";
    }
    tagUID += String(mfrc522.uid.uidByte[i], HEX);
  }
  tagUID.toUpperCase();
  
  // Check cooldown period
  unsigned long now = millis();
  if (tagUID == lastScannedTag && (now - lastScanTime) < SCAN_COOLDOWN) {
    return; // Ignore duplicate scan
  }
  
  lastScannedTag = tagUID;
  lastScanTime = now;
  
  Serial.println("\n--- RFID Tag Detected ---");
  Serial.print("UID: ");
  Serial.println(tagUID);
  
  // Visual feedback
  digitalWrite(LED_GREEN_PIN, HIGH);
  beep(100);
  
  // Send to backend API
  bool success = sendToBackend(tagUID);
  
  if (success) {
    Serial.println("✓ Entry/Exit logged successfully");
    blinkGreen(2);
  } else {
    Serial.println("✗ Failed to log entry/exit");
    blinkRed(2);
    sendDeviceError("Failed to log RFID scan", "API_CALL_FAIL");
  }
  
  digitalWrite(LED_GREEN_PIN, LOW);
  Serial.println("-------------------------\n");
}

bool sendToBackend(String tagUID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }
  
  // Create API endpoint URL
  String url = "http://" + String(MQTT_SERVER) + ":3001/api/logs";
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["livestockId"] = tagUID; // In production, map UID to livestock ID
  doc["barnId"] = BARN_ID;
  doc["eventType"] = "entry"; // Determine based on logic
  doc["rfidReaderId"] = DEVICE_ID;
  doc["timestamp"] = getISOTimestamp();
  
  String payload;
  serializeJson(doc, payload);
  
  // Send HTTP POST request
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(payload);
  
  bool success = false;
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      String response = http.getString();
      Serial.println("Response: " + response);
      success = true;
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  return success;
}

void sendDeviceStatus(const char* status) {
  StaticJsonDocument<256> doc;
  doc["status"] = status;
  doc["timestamp"] = getISOTimestamp();
  
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["type"] = "rfid_reader";
  metadata["version"] = "1.0.0";
  metadata["firmware"] = "esp32-v1.0.0";
  
  String payload;
  serializeJson(doc, payload);
  
  String topic = "livestock/devices/" + String(DEVICE_ID) + "/status";
  mqttClient.publish(topic.c_str(), payload.c_str(), true);
  
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
  metadata["type"] = "rfid_reader";
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
  unsigned long seconds = millis() / 1000;
  char timestamp[32];
  sprintf(timestamp, "2024-01-07T%02lu:%02lu:%02luZ", 
          (seconds / 3600) % 24, 
          (seconds / 60) % 60, 
          seconds % 60);
  return String(timestamp);
}

// LED and Buzzer functions
void testIndicators() {
  Serial.println("Testing indicators...");
  
  digitalWrite(LED_GREEN_PIN, HIGH);
  delay(200);
  digitalWrite(LED_GREEN_PIN, LOW);
  
  digitalWrite(LED_RED_PIN, HIGH);
  delay(200);
  digitalWrite(LED_RED_PIN, LOW);
  
  beep(100);
  delay(100);
  beep(100);
  
  Serial.println("Indicators OK");
}

void blinkGreen(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_GREEN_PIN, HIGH);
    beep(50);
    delay(100);
    digitalWrite(LED_GREEN_PIN, LOW);
    delay(100);
  }
}

void blinkRed(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_RED_PIN, HIGH);
    beep(200);
    delay(200);
    digitalWrite(LED_RED_PIN, LOW);
    delay(200);
  }
}

void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}
