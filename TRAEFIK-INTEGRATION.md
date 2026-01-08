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

Pastikan DNS sudah pointing ke server:

```
livestock.yourdomain.com      → YOUR_SERVER_IP
api-livestock.yourdomain.com  → YOUR_SERVER_IP
```

## 🔧 Configuration

### 1. Environment Variables

Edit `.env`:

```bash
# Domain Configuration
DOMAIN=yourdomain.com
FRONTEND_SUBDOMAIN=livestock
BACKEND_SUBDOMAIN=api-livestock

# Traefik Network (must match your Traefik network name)
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
  - traefik.http.routers.livestock-backend.rule=Host(`api-livestock.yourdomain.com`)
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
  - traefik.http.routers.livestock-frontend.rule=Host(`livestock.yourdomain.com`)
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
curl -I https://livestock.yourdomain.com
curl -I https://api-livestock.yourdomain.com
```

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
nslookup livestock.yourdomain.com
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

## 🎯 Customization

### Change Subdomain

Edit `.env`:
```bash
FRONTEND_SUBDOMAIN=app
BACKEND_SUBDOMAIN=api

# Results in:
# Frontend: https://app.yourdomain.com
# Backend: https://api.yourdomain.com
```

### Add Custom Middleware

Edit `docker-compose.prod.yml`:

```yaml
labels:
  # Add rate limiting
  - traefik.http.routers.livestock-backend.middlewares=rate-limit
  - traefik.http.middlewares.rate-limit.ratelimit.average=100
  - traefik.http.middlewares.rate-limit.ratelimit.burst=50
  
  # Add IP whitelist
  - traefik.http.middlewares.ip-whitelist.ipwhitelist.sourcerange=192.168.1.0/24
```

### Multiple Domains

```yaml
labels:
  - traefik.http.routers.livestock-frontend.rule=Host(`livestock.com`) || Host(`www.livestock.com`)
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
└────────────┘  └─────────────┘  └────────────┘
```

## 🔐 Security Notes

1. **Internal Network**: MongoDB, Redis, Mosquitto hanya di internal network
2. **Traefik Network**: Hanya Backend dan Frontend yang exposed via Traefik
3. **MQTT Port**: Port 1883 tetap exposed untuk IoT devices
4. **SSL/HTTPS**: Dihandle oleh Traefik yang sudah ada

## 📝 IoT Device Configuration

Devices connect via MQTT (tidak melalui Traefik):

```cpp
// config.h
#define MQTT_SERVER "yourdomain.com"  // or server IP
#define MQTT_PORT 1883  // Direct connection, not via Traefik
```

MQTT port 1883 tetap exposed di `docker-compose.prod.yml`:
```yaml
mosquitto:
  ports:
    - "1883:1883"
```

## ✅ Checklist

- [ ] Traefik sudah running di server
- [ ] Traefik network exists (`docker network ls | grep traefik`)
- [ ] DNS configured (pointing to server IP)
- [ ] `.env` configured dengan domain dan passwords
- [ ] Services deployed (`./deploy.sh start`)
- [ ] Services accessible via domain
- [ ] SSL/HTTPS working
- [ ] MQTT port 1883 accessible untuk IoT devices

## 📚 Additional Resources

- **Traefik Docs**: https://doc.traefik.io/traefik/
- **Docker Labels**: https://doc.traefik.io/traefik/routing/providers/docker/
- **Main README**: `README.md`
- **Quick Start**: `QUICK-START-PRODUCTION.md`

---

**Integration complete! 🎉**

Your services are now integrated with existing Traefik for automatic SSL/HTTPS.
