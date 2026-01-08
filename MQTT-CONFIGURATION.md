# 🔌 MQTT Configuration Guide

Panduan konfigurasi MQTT untuk IoT devices (ESP32/Arduino) dengan setup domain yang berbeda.

## 📋 Situasi

Anda memiliki:
- **Domain utama**: `nafhan.com` → pointing ke server lain
- **Subdomain frontend**: `livestock.nafhan.com` → pointing ke server livestock
- **Subdomain backend**: `api-livestock.nafhan.com` → pointing ke server livestock
- **MQTT broker**: Running di server livestock (port 1883)

## 🎯 Opsi Konfigurasi MQTT

### **Opsi 1: Subdomain Khusus MQTT (Recommended)**

#### Kelebihan:
✅ Professional dan mudah diingat
✅ Tidak perlu hardcode IP address
✅ Bisa pindah server tanpa update firmware
✅ Support SSL/TLS di masa depan

#### Kekurangan:
❌ Perlu setup DNS tambahan

#### Setup:

**1. Tambahkan DNS Record:**
```
Type    Name              Value
A       mqtt-livestock    YOUR_SERVER_IP
```

**2. Verify DNS:**
```bash
nslookup mqtt-livestock.nafhan.com
# Should return: YOUR_SERVER_IP
```

**3. ESP32/Arduino Configuration:**
```cpp
// config.h
#define MQTT_SERVER "mqtt-livestock.nafhan.com"
#define MQTT_PORT 1883
```

**4. Test Connection:**
```bash
# From your computer
mosquitto_sub -h mqtt-livestock.nafhan.com -t "test" -v

# Should connect successfully
```

---

### **Opsi 2: IP Address Langsung (Simplest)**

#### Kelebihan:
✅ Tidak perlu DNS setup
✅ Works immediately
✅ Simple dan straightforward

#### Kekurangan:
❌ Hardcoded IP (sulit jika pindah server)
❌ Perlu update firmware jika IP berubah
❌ Kurang professional

#### Setup:

**1. Get Server IP:**
```bash
# On server
curl ifconfig.me
# Or
ip addr show
```

**2. ESP32/Arduino Configuration:**
```cpp
// config.h
#define MQTT_SERVER "123.456.789.10"  // Your server IP
#define MQTT_PORT 1883
```

**3. Test Connection:**
```bash
# From your computer
mosquitto_sub -h 123.456.789.10 -t "test" -v
```

---

### **Opsi 3: Gunakan Subdomain Backend (Advanced)**

#### Kelebihan:
✅ Tidak perlu DNS tambahan
✅ Reuse existing subdomain

#### Kekurangan:
❌ Perlu expose MQTT via Traefik (kompleks)
❌ MQTT over WebSocket (perlu modifikasi)
❌ Not recommended untuk production

#### Setup (Not Recommended):

Perlu konfigurasi Traefik untuk TCP routing:
```yaml
# Traefik config (kompleks)
--entrypoints.mqtt.address=:1883
```

**Tidak direkomendasikan** karena MQTT biasanya direct connection, bukan via HTTP proxy.

---

## 🚀 Recommended Setup

### Untuk Production: **Opsi 1 (Subdomain)**

**1. Setup DNS:**
```
mqtt-livestock.nafhan.com → YOUR_SERVER_IP
```

**2. Update `.env`:**
```bash
MQTT_SUBDOMAIN=mqtt-livestock
```

**3. ESP32/Arduino:**
```cpp
#define MQTT_SERVER "mqtt-livestock.nafhan.com"
#define MQTT_PORT 1883
```

### Untuk Development/Testing: **Opsi 2 (IP Address)**

**1. Update `.env`:**
```bash
MQTT_SERVER_IP=123.456.789.10
```

**2. ESP32/Arduino:**
```cpp
#define MQTT_SERVER "123.456.789.10"
#define MQTT_PORT 1883
```

---

## 🔧 Docker Configuration

MQTT port sudah exposed di `docker-compose.prod.yml`:

```yaml
mosquitto:
  ports:
    - "1883:1883"  # MQTT
    - "9001:9001"  # WebSocket (optional)
```

**Port 1883** accessible dari:
- ✅ Internet (jika firewall allow)
- ✅ Local network
- ✅ IoT devices

---

## 🔐 Firewall Configuration

Pastikan port 1883 terbuka:

```bash
# Check firewall
sudo ufw status

# Allow MQTT port
sudo ufw allow 1883/tcp

# Reload firewall
sudo ufw reload

# Verify
sudo ufw status | grep 1883
```

---

## 🧪 Testing MQTT Connection

### From Computer

```bash
# Subscribe to test topic
mosquitto_sub -h mqtt-livestock.nafhan.com -t "test" -v

# In another terminal, publish
mosquitto_pub -h mqtt-livestock.nafhan.com -t "test" -m "Hello MQTT"
```

### From ESP32/Arduino

Upload test sketch:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

#define WIFI_SSID "Your_WiFi"
#define WIFI_PASSWORD "Your_Password"
#define MQTT_SERVER "mqtt-livestock.nafhan.com"
#define MQTT_PORT 1883

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  
  // Connect MQTT
  client.setServer(MQTT_SERVER, MQTT_PORT);
  
  if (client.connect("ESP32-Test")) {
    Serial.println("MQTT connected!");
    client.publish("test", "Hello from ESP32");
  } else {
    Serial.print("MQTT failed, rc=");
    Serial.println(client.state());
  }
}

void loop() {
  client.loop();
}
```

---

## 📊 Network Flow

### Opsi 1: Subdomain
```
ESP32/Arduino
    ↓
DNS: mqtt-livestock.nafhan.com → SERVER_IP
    ↓
Server:1883 (Mosquitto)
    ↓
Backend (subscribes to topics)
```

### Opsi 2: IP Address
```
ESP32/Arduino
    ↓
Direct: SERVER_IP:1883
    ↓
Server:1883 (Mosquitto)
    ↓
Backend (subscribes to topics)
```

---

## 🔍 Troubleshooting

### Device Can't Connect to MQTT

**1. Check DNS (if using subdomain):**
```bash
nslookup mqtt-livestock.nafhan.com
# Should return your server IP
```

**2. Check Firewall:**
```bash
sudo ufw status | grep 1883
# Should show: 1883/tcp ALLOW
```

**3. Check Mosquitto is Running:**
```bash
docker compose -f docker-compose.prod.yml ps mosquitto
# Should show: healthy
```

**4. Test from Server:**
```bash
# On server
mosquitto_sub -h localhost -t "test" -v
# Should connect
```

**5. Test from Internet:**
```bash
# From your computer
mosquitto_sub -h mqtt-livestock.nafhan.com -t "test" -v
# Should connect
```

### Connection Timeout

**Problem:** Device can't reach MQTT broker

**Check:**
```bash
# From device network, ping server
ping mqtt-livestock.nafhan.com

# Check if port is open
telnet mqtt-livestock.nafhan.com 1883
```

**Solution:**
- Verify firewall allows port 1883
- Check server is accessible from internet
- Verify DNS is correct

### Authentication Failed

**Problem:** MQTT connection rejected

**Check:**
```bash
# Check Mosquitto config
docker compose -f docker-compose.prod.yml exec mosquitto \
  cat /mosquitto/config/mosquitto.conf
```

**Solution:**
- Verify `allow_anonymous true` in mosquitto.conf
- Or configure username/password authentication

---

## 📝 Example Configurations

### ESP32 Gas Sensor

```cpp
// config.h
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// Option 1: Subdomain
#define MQTT_SERVER "mqtt-livestock.nafhan.com"

// Option 2: IP Address
// #define MQTT_SERVER "123.456.789.10"

#define MQTT_PORT 1883
#define DEVICE_ID "GAS-001"
#define BARN_ID "BARN-001"
```

### ESP32 RFID Reader

```cpp
// config.h
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// Option 1: Subdomain
#define MQTT_SERVER "mqtt-livestock.nafhan.com"

// Option 2: IP Address
// #define MQTT_SERVER "123.456.789.10"

#define MQTT_PORT 1883
#define DEVICE_ID "RFID-READER-001"
#define BARN_ID "BARN-001"
```

---

## 🎯 Recommendation

**For Your Setup (nafhan.com):**

1. **Create DNS Record:**
   ```
   mqtt-livestock.nafhan.com → YOUR_SERVER_IP
   ```

2. **Use in ESP32/Arduino:**
   ```cpp
   #define MQTT_SERVER "mqtt-livestock.nafhan.com"
   ```

3. **Benefits:**
   - Professional setup
   - Easy to remember
   - Flexible (can change server without firmware update)
   - Consistent with your subdomain structure

**Alternative (Quick Start):**

If you want to test immediately without DNS setup:
```cpp
#define MQTT_SERVER "YOUR_SERVER_IP"  // e.g., "103.123.45.67"
```

---

## ✅ Checklist

- [ ] Choose MQTT configuration method (subdomain or IP)
- [ ] Setup DNS (if using subdomain)
- [ ] Verify DNS resolves correctly
- [ ] Check firewall allows port 1883
- [ ] Test MQTT connection from computer
- [ ] Update ESP32/Arduino config.h
- [ ] Upload firmware to devices
- [ ] Verify devices connect successfully
- [ ] Check devices appear in dashboard

---

## 📚 Related Documentation

- **Hardware Setup**: `packages/simulator/hardware/README.md`
- **ESP32 Code**: `packages/simulator/hardware/esp32_gas_sensor.ino`
- **Traefik Integration**: `TRAEFIK-INTEGRATION.md`
- **Production Deployment**: `PRODUCTION-DEPLOYMENT.md`

---

**MQTT configuration complete! 🎉**

Your IoT devices can now connect to the MQTT broker using subdomain or IP address.
