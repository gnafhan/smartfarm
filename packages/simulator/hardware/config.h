/**
 * Configuration File
 * 
 * Copy this file and customize for your deployment
 * 
 * IMPORTANT: Never commit this file with real credentials!
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// WiFi Configuration
// ============================================
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ============================================
// MQTT Broker Configuration
// ============================================
#define MQTT_SERVER "192.168.1.100"  // IP address of your MQTT broker
#define MQTT_PORT 1883
#define MQTT_USER ""                  // Leave empty if no authentication
#define MQTT_PASSWORD ""

// ============================================
// Device Configuration
// ============================================
// Gas Sensor Device
#define DEVICE_ID "GAS-001"          // Unique device ID (change for each device)
#define BARN_ID "BARN-001"           // Barn assignment

// RFID Reader Device
// #define DEVICE_ID "RFID-READER-001"
// #define BARN_ID "BARN-001"

// ============================================
// Gas Sensor Pin Configuration (ESP32)
// ============================================
#define MQ4_PIN 34      // GPIO 34 (ADC1_CH6) - Methane sensor
#define MQ135_PIN 35    // GPIO 35 (ADC1_CH7) - CO2 sensor
#define MQ137_PIN 32    // GPIO 32 (ADC1_CH4) - NH3 sensor
#define DHT_PIN 4       // GPIO 4 - DHT22 Temperature & Humidity

// ============================================
// RFID Reader Pin Configuration (ESP32)
// ============================================
#define RFID_SDA_PIN 21   // GPIO 21 - SDA/SS
#define RFID_RST_PIN 22   // GPIO 22 - RST
#define RFID_SCK_PIN 18   // GPIO 18 - SCK
#define RFID_MOSI_PIN 23  // GPIO 23 - MOSI
#define RFID_MISO_PIN 19  // GPIO 19 - MISO

// LED and Buzzer Pins
#define LED_GREEN_PIN 25  // GPIO 25 - Success indicator
#define LED_RED_PIN 26    // GPIO 26 - Error indicator
#define BUZZER_PIN 27     // GPIO 27 - Audio feedback

// ============================================
// Timing Configuration
// ============================================
#define READING_INTERVAL 10000     // 10 seconds - sensor reading interval
#define HEARTBEAT_INTERVAL 30000   // 30 seconds - heartbeat interval
#define RECONNECT_DELAY 5000       // 5 seconds - reconnection delay

// ============================================
// Sensor Calibration (Gas Sensors)
// ============================================
// Adjust these values based on your sensor calibration
// Calibrate in clean air and measure R0 resistance
#define MQ4_R0 10.0      // Resistance in clean air (kΩ)
#define MQ135_R0 10.0    // Resistance in clean air (kΩ)
#define MQ137_R0 10.0    // Resistance in clean air (kΩ)

// ============================================
// Advanced Configuration
// ============================================
// Enable debug output
#define DEBUG_MODE true

// NTP Server for time synchronization (optional)
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC 0
#define DAYLIGHT_OFFSET_SEC 0

// Watchdog timer (milliseconds)
#define WATCHDOG_TIMEOUT 60000  // 60 seconds

// MQTT QoS levels
#define MQTT_QOS_SENSOR 1       // QoS for sensor readings
#define MQTT_QOS_STATUS 1       // QoS for status messages
#define MQTT_QOS_HEARTBEAT 0    // QoS for heartbeat (can be 0)

// Buffer sizes
#define JSON_BUFFER_SIZE 512
#define MQTT_BUFFER_SIZE 512

#endif // CONFIG_H
