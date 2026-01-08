# 🔗 Traefik Integration Guide

Panduan integrasi dengan Traefik yang sudah running di server.

## 📋 Overview

Docker Compose configuration ini dirancang untuk bekerja dengan **Traefik yang sudah ada** di server Anda. Services akan otomatis ter-discover oleh Traefik melalui Docker labels.

## ✅ Prerequisites

### 1. Traefik Sudah Running

Pastikan Traefik sudah running di server dengan konfigurasi:

```yaml
# Traefik harus enable Docker provider
--providers.docker=true
--providers.docker.exposedbydefault=false

# Entrypoints
--entrypoints.web.address=:80
--entrypoints.websecure.address=:443

# Let's Encrypt (optional)
--certificatesresolvers.mytlschallenge.acme.tlschallenge=true
```

### 2. Traefik Network Exists

```bash
# Check if traefik network exists
docker network ls | grep traefik

# If not exists, create it
docker network create traefik
```

### 3. DNS Configuration

Pastikan DNS sudah pointing ke server livestock:

```
livestock.nafhan.com      → SERVER_LIVESTOCK_IP
api-livestock.nafhan.com  → SERVER_LIVESTOCK_IP
mqtt-livestock.nafhan.com → SERVER_LIVESTOCK_IP (optional, for MQTT)
```

**Note:** `nafhan.com` bisa pointing ke server lain, tidak masalah.

## 🔧 Configuration

### 1. Environment Variables

Edit `.env`:

```bash
# Domain Configuration
DOMAIN=nafhan.com
FRONTEND_SUBDOMAIN=livestock
BACKEND_SUBDOMAIN=api-livestock

# MQTT Configuration (choose one)
# Option 1: Subdomain
MQTT_SUBDOMAIN=mqtt-livestock

# Option 2: IP Address
MQTT_SERVER_IP=123.456.789.10

# Traefik Network
TRAEFIK_NETWORK=traefik

# Strong Passwords
MONGO_ROOT_PASSWORD=your_strong_password
REDIS_PASSWORD=your_strong_password
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
```

### 2. Traefik Labels

Services sudah dikonfigurasi dengan Traefik labels:

**Backend:**
```yaml
labels:
  - traefik.enable=true
  - traefik.docker.network=traefik
  - traefik.http.routers.livestock-backend.rule=Host(`api-livestock.nafhan.com`)
  - traefik.http.routers.livestock-backend.entrypoints=web,websecure
  - traefik.http.routers.livestock-backend.tls=true
  - traefik.http.routers.livestock-backend.tls.certresolver=mytlschallenge
  - traefik.http.services.livestock-backend.loadbalancer.server.port=3001
```

**Frontend:**
```yaml
labels:
  - traefik.enable=true
  - traefik.docker.network=traefik
  - traefik.http.routers.livestock-frontend.rule=Host(`livestock.nafhan.com`)
  - traefik.http.routers.livestock-frontend.entrypoints=web,websecure
  - traefik.http.routers.livestock-frontend.tls=true
  - traefik.http.routers.livestock-frontend.tls.certresolver=mytlschallenge
  - traefik.http.services.livestock-frontend.loadbalancer.server.port=3000
```

## 🚀 Deployment

### Quick Start

```bash
# 1. Configure environment
cp .env.production .env
nano .env  # Update DOMAIN and passwords

# 2. Verify Traefik network
docker network ls | grep traefik

# 3. Deploy
./deploy.sh build
./deploy.sh start

# 4. Check status
./deploy.sh status
```

### Verify Integration

```bash
# Check services are connected to Traefik network
docker network inspect traefik

# Check Traefik can see the services
docker logs <traefik-container-name> | grep livestock

# Test URLs
curl -I https://livestock.nafhan.com
curl -I https://api-livestock.nafhan.com
```

## 📝 MQTT Configuration

### IMPORTANT: MQTT Tidak Melalui Traefik

MQTT broker (port 1883) **tidak** melalui Traefik. IoT devices connect langsung ke MQTT broker.

### Opsi 1: Subdomain (Recommended)

**Setup DNS:**
```
mqtt-livestock.nafhan.com → SERVER_LIVESTOCK_IP
```

**ESP32/Arduino:**
```cpp
#define MQTT_SERVER "mqtt-livestock.nafhan.com"
#define MQTT_PORT 1883
```

### Opsi 2: IP Address (Simplest)

**ESP32/Arduino:**
```cpp
#define MQTT_SERVER "123.456.789.10"  // Your server IP
#define MQTT_PORT 1883
```

**📖 Detailed MQTT Guide:** See `MQTT-CONFIGURATION.md`

## 🔍 Troubleshooting

### Services Not Accessible

**Problem:** Can't access services via domain

**Check:**
```bash
# 1. Verify services are running
docker compose -f docker-compose.prod.yml ps

# 2. Check services are on traefik network
docker network inspect traefik | grep livestock

# 3. Check Traefik logs
docker logs <traefik-container> | grep livestock

# 4. Verify DNS
nslookup livestock.nafhan.com
```

**Solution:**
```bash
# Restart services
docker compose -f docker-compose.prod.yml restart backend frontend
```

### SSL Certificate Issues

**Problem:** SSL not working

**Check:**
```bash
# Verify certresolver name matches your Traefik config
# In docker-compose.prod.yml:
# tls.certresolver=mytlschallenge

# Check your Traefik certresolver name
docker logs <traefik-container> | grep certresolver
```

**Solution:**
Update `docker-compose.prod.yml` if certresolver name different:
```yaml
- traefik.http.routers.livestock-backend.tls.certresolver=YOUR_CERTRESOLVER_NAME
```

### Network Not Found

**Problem:** `network traefik declared as external, but could not be found`

**Solution:**
```bash
# Create traefik network
docker network create traefik

# Or update .env with correct network name
TRAEFIK_NETWORK=your_traefik_network_name
```

### MQTT Connection Issues

**Problem:** IoT devices can't connect to MQTT

**Check:**
```bash
# 1. Verify Mosquitto is running
docker compose -f docker-compose.prod.yml ps mosquitto

# 2. Check firewall
sudo ufw status | grep 1883

# 3. Test from server
mosquitto_sub -h localhost -t "test" -v

# 4. Test from internet
mosquitto_sub -h mqtt-livestock.nafhan.com -t "test" -v
```

**Solution:**
```bash
# Allow MQTT port
sudo ufw allow 1883/tcp
sudo ufw reload
```

## 📊 Network Architecture

```
┌─────────────────────────────────────────┐
│     Traefik (External - Already Running) │
│     - Auto SSL/HTTPS                     │
│     - Service Discovery                  │
└────────────────┬────────────────────────┘
                 │ traefik network
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐  ┌────▼──────────┐
│   Frontend     │  │   Backend     │
│   Port 3000    │  │   Port 3001   │
└────────────────┘  └────┬──────────┘
                         │ livestock-network
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────┐  ┌────────▼────┐  ┌───────▼────┐
│  MongoDB   │  │   Redis     │  │ Mosquitto  │
│            │  │             │  │  Port 1883 │
└────────────┘  └─────────────┘  └─────┬──────┘
                                       │
                                       │ Direct (not via Traefik)
                                       │
                                ┌──────▼──────┐
                                │ IoT Devices │
                                │(ESP32/Arduino)│
                                └─────────────┘
```

## ✅ Checklist

- [ ] Traefik sudah running di server
- [ ] Traefik network exists (`docker network ls | grep traefik`)
- [ ] DNS configured untuk subdomain livestock
  - [ ] livestock.nafhan.com → SERVER_IP
  - [ ] api-livestock.nafhan.com → SERVER_IP
  - [ ] mqtt-livestock.nafhan.com → SERVER_IP (optional)
- [ ] `.env` configured dengan domain dan passwords
- [ ] Services deployed (`./deploy.sh start`)
- [ ] Services accessible via domain
- [ ] SSL/HTTPS working
- [ ] MQTT port 1883 accessible untuk IoT devices
- [ ] Firewall allows port 1883

## 📚 Additional Resources

- **MQTT Configuration**: `MQTT-CONFIGURATION.md` - Complete MQTT setup guide
- **Traefik Docs**: https://doc.traefik.io/traefik/
- **Docker Labels**: https://doc.traefik.io/traefik/routing/providers/docker/
- **Main README**: `README.md`
- **Quick Start**: `QUICK-START-PRODUCTION.md`

---

**Integration complete! 🎉**

Your services are now integrated with existing Traefik for automatic SSL/HTTPS, and MQTT is accessible for IoT devices.
