# ⚡ Quick Start - Production Deployment

Panduan cepat untuk deploy ke production dalam 10 menit.

## 🚀 Prerequisites

- Server dengan Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Docker dan Docker Compose installed
- Minimal 4GB RAM, 2 CPU cores, 50GB storage
- IP address atau domain

## 📝 Step-by-Step

### 1. Install Docker (jika belum)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### 2. Clone Repository

```bash
# Clone
git clone <repository-url>
cd livestock-monitoring-system

# Or if already cloned
cd livestock-monitoring-system
git pull origin main
```

### 3. Configure Environment

```bash
# Copy template
cp .env.production .env

# Edit configuration
nano .env
```

**Minimal configuration yang HARUS diubah:**

```bash
# Strong passwords
MONGO_ROOT_PASSWORD=your_strong_password_here
REDIS_PASSWORD=your_strong_password_here
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Your server IP (e.g., 192.168.1.100)
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001
NEXT_PUBLIC_WS_URL=http://YOUR_SERVER_IP:3001
CORS_ORIGIN=http://YOUR_SERVER_IP:3000
```

**Generate strong passwords:**
```bash
# Generate random password
openssl rand -base64 32
```

### 4. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Check requirements
./deploy.sh check

# Build images (5-10 minutes)
./deploy.sh build

# Start all services
./deploy.sh start

# Check status
./deploy.sh status
```

### 5. Verify

```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# All should show "healthy" status

# Test backend
curl http://localhost:3001/

# Test frontend
curl http://localhost:3000/
```

### 6. Access Application

Open browser:
- **Frontend**: `http://YOUR_SERVER_IP:3000`
- **Backend API**: `http://YOUR_SERVER_IP:3001`

**Default Login:**
- Email: `admin@livestock.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Change password immediately after first login!

### 7. Configure IoT Devices

Update ESP32/Arduino `config.h`:

```cpp
// WiFi
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// MQTT Broker
#define MQTT_SERVER "YOUR_SERVER_IP"  // e.g., "192.168.1.100"
#define MQTT_PORT 1883

// Device ID (unique per device)
#define DEVICE_ID "GAS-001"
#define BARN_ID "BARN-001"
```

Upload firmware dan device akan auto-register!

## 🔥 Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS (if using SSL)
sudo ufw allow 1883/tcp    # MQTT (for IoT devices)
sudo ufw allow 22/tcp      # SSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 📊 Monitoring

```bash
# View logs
./deploy.sh logs

# View specific service logs
./deploy.sh logs backend
./deploy.sh logs frontend

# Check service status
./deploy.sh status

# Check resource usage
docker stats
```

## 🔧 Common Commands

```bash
# Start services
./deploy.sh start

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart

# View logs
./deploy.sh logs

# Backup database
./deploy.sh backup

# Update application
./deploy.sh update

# Seed initial data
./deploy.sh seed
```

## 🆘 Troubleshooting

### Services won't start

```bash
# Check logs
./deploy.sh logs

# Restart services
./deploy.sh restart

# Rebuild if needed
./deploy.sh build
./deploy.sh start
```

### Can't access from other devices

```bash
# Check firewall
sudo ufw status

# Check services are running
./deploy.sh status

# Check server IP
ip addr show
```

### IoT devices can't connect

```bash
# Check MQTT broker
./deploy.sh logs mosquitto

# Test MQTT
mosquitto_sub -h localhost -t "test" -v

# Check firewall allows port 1883
sudo ufw status | grep 1883
```

### Frontend can't connect to backend

```bash
# Check .env configuration
cat .env | grep NEXT_PUBLIC

# Rebuild frontend with correct env
docker compose -f docker-compose.prod.yml up -d --build frontend
```

## 📚 Next Steps

1. ✅ Change default admin password
2. ✅ Create farms and barns
3. ✅ Configure IoT devices
4. ✅ Setup SSL/HTTPS (optional)
5. ✅ Setup automated backups
6. ✅ Configure email notifications (optional)

## 📖 Full Documentation

- **Production Deployment**: `PRODUCTION-DEPLOYMENT.md`
- **Hardware Setup**: `packages/simulator/hardware/README.md`
- **API Documentation**: `packages/backend/README.md`
- **Main README**: `README.md`

## 🎉 Done!

Your Livestock IoT Monitoring System is now running in production!

**Access URLs:**
- Frontend: `http://YOUR_SERVER_IP:3000`
- Backend: `http://YOUR_SERVER_IP:3001`
- MQTT: `mqtt://YOUR_SERVER_IP:1883`

**Support:**
- GitHub Issues: [repository-url]
- Email: support@livestock-monitoring.com
