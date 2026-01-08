# 🚀 Production Deployment Guide

Panduan lengkap untuk deploy Livestock IoT Monitoring System ke production menggunakan Docker.

## 📋 Daftar Isi

- [Prerequisites](#prerequisites)
- [Server Requirements](#server-requirements)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment Steps](#deployment-steps)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Prerequisites

### Software Requirements

- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **Git**: >= 2.0
- **Domain** (optional): Untuk SSL/HTTPS

### Install Docker

#### Ubuntu/Debian
```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

#### CentOS/RHEL
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version
```

## Server Requirements

### Minimum Requirements (Small Farm: 50-100 ternak)

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Network**: 10 Mbps
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### Recommended Requirements (Medium Farm: 200-500 ternak)

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Network**: 50 Mbps
- **OS**: Ubuntu 22.04 LTS

### Large Scale (1000+ ternak)

- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Storage**: 200+ GB SSD
- **Network**: 100+ Mbps
- **Load Balancer**: Recommended
- **Database**: Consider separate MongoDB server

## Quick Start

### 1. Clone Repository

```bash
# Clone repository
git clone <repository-url>
cd livestock-monitoring-system

# Or if already cloned, pull latest
git pull origin main
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit with your values
nano .env
```

**Important:** Update these values:
- `MONGO_ROOT_PASSWORD`: Strong password untuk MongoDB
- `REDIS_PASSWORD`: Strong password untuk Redis
- `JWT_SECRET`: Random string minimal 32 karakter
- `NEXT_PUBLIC_API_URL`: IP address atau domain server Anda
- `SMTP_*`: Email configuration (optional)

### 3. Build and Start

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Verify Deployment

```bash
# Check all services are healthy
docker compose -f docker-compose.prod.yml ps

# Test backend
curl http://localhost:3001/

# Test frontend
curl http://localhost:3000/

# Test MQTT
mosquitto_sub -h localhost -t "test" -v
```

### 5. Access Application

- **Frontend**: http://YOUR_SERVER_IP:3000
- **Backend API**: http://YOUR_SERVER_IP:3001
- **MQTT Broker**: mqtt://YOUR_SERVER_IP:1883

**Default Login:**
- Email: `admin@livestock.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Change default password immediately!

## Configuration

### Environment Variables

#### MongoDB
```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_strong_password_here
```

#### Redis
```bash
REDIS_PASSWORD=your_strong_password_here
```

#### JWT
```bash
# Generate random secret:
# openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
```

#### Frontend URLs

**For Local Network (e.g., 192.168.1.100):**
```bash
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001
NEXT_PUBLIC_WS_URL=http://192.168.1.100:3001
CORS_ORIGIN=http://192.168.1.100:3000
```

**For Domain with Nginx:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

#### Email (Optional)

**Gmail:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Not regular password!
SMTP_FROM=noreply@livestock.com
```

**Other SMTP:**
```bash
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM=noreply@livestock.com
```

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MQTT (for IoT devices)
sudo ufw allow 1883/tcp

# Allow SSH (if not already)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Port Mapping

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Frontend | 3000 | 3000 | HTTP |
| Backend | 3001 | 3001 | HTTP |
| MongoDB | 27017 | 27017 | TCP |
| Redis | 6379 | 6379 | TCP |
| MQTT | 1883 | 1883 | TCP |
| MQTT WebSocket | 9001 | 9001 | WS |
| Nginx HTTP | 80 | 80 | HTTP |
| Nginx HTTPS | 443 | 443 | HTTPS |

## Deployment Steps

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git curl wget nano

# Create application directory
sudo mkdir -p /opt/livestock-monitoring
sudo chown $USER:$USER /opt/livestock-monitoring
cd /opt/livestock-monitoring
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone <repository-url> .

# Copy and edit environment
cp .env.production .env
nano .env

# Create required directories
mkdir -p logs/backend logs/nginx backups/mongodb nginx/ssl
```

### Step 3: Build Images

```bash
# Build all images
docker compose -f docker-compose.prod.yml build --no-cache

# This will take 5-10 minutes depending on your server
```

### Step 4: Start Services

```bash
# Start infrastructure first (MongoDB, Redis, MQTT)
docker compose -f docker-compose.prod.yml up -d mongodb redis mosquitto

# Wait for services to be healthy (30-60 seconds)
docker compose -f docker-compose.prod.yml ps

# Start backend
docker compose -f docker-compose.prod.yml up -d backend

# Wait for backend to be healthy (30-60 seconds)
docker compose -f docker-compose.prod.yml ps

# Start frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Start nginx (optional)
docker compose -f docker-compose.prod.yml up -d nginx
```

### Step 5: Verify Deployment

```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# All services should show "healthy" status

# Check logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Test endpoints
curl http://localhost:3001/
curl http://localhost:3000/
```

### Step 6: Seed Initial Data (Optional)

```bash
# Run seed script
docker compose -f docker-compose.prod.yml exec backend npm run seed

# This creates:
# - Admin user (admin@livestock.com / admin123)
# - Sample farm and barns
# - Sample livestock
```

### Step 7: Configure IoT Devices

Update ESP32/Arduino `config.h`:

```cpp
// WiFi Configuration
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// MQTT Configuration
#define MQTT_SERVER "192.168.1.100"  // Your server IP
#define MQTT_PORT 1883

// Device Configuration
#define DEVICE_ID "GAS-001"  // Unique per device
#define BARN_ID "BARN-001"   // From your system
```

Upload firmware dan verify device muncul di dashboard.

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem

# Update nginx.conf (uncomment HTTPS section)
nano nginx/nginx.conf

# Restart nginx
docker compose -f docker-compose.prod.yml up -d nginx

# Setup auto-renewal
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet && docker compose -f /opt/livestock-monitoring/docker-compose.prod.yml restart nginx
```

### Option 2: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Livestock/CN=yourdomain.com"

# Update nginx.conf (uncomment HTTPS section)
nano nginx/nginx.conf

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Update Environment for HTTPS

```bash
# Edit .env
nano .env

# Update URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Rebuild frontend
docker compose -f docker-compose.prod.yml up -d --build frontend
```

## Monitoring

### Docker Stats

```bash
# Real-time stats
docker stats

# Specific service
docker stats livestock-backend-prod
```

### Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Since timestamp
docker compose -f docker-compose.prod.yml logs --since 2024-01-07T10:00:00 backend
```

### Health Checks

```bash
# Check service health
docker compose -f docker-compose.prod.yml ps

# Manual health check
curl http://localhost:3001/
curl http://localhost:3000/
curl http://localhost/health  # Nginx
```

### Resource Usage

```bash
# Disk usage
docker system df

# Volume usage
docker volume ls
du -sh /var/lib/docker/volumes/*

# Clean up unused resources
docker system prune -a --volumes
```

## Backup & Recovery

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/livestock-monitoring/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR/mongodb

# Backup MongoDB
docker compose -f docker-compose.prod.yml exec -T mongodb \
  mongodump --username admin --password changeme123 \
  --authenticationDatabase admin \
  --out /backups/mongodb_$DATE

# Compress backup
cd $BACKUP_DIR
tar -czf mongodb_$DATE.tar.gz mongodb_$DATE
rm -rf mongodb_$DATE

# Remove old backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: mongodb_$DATE.tar.gz"
```

Make executable and schedule:

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/livestock-monitoring/backup.sh
```

### Manual Backup

```bash
# MongoDB backup
docker compose -f docker-compose.prod.yml exec mongodb \
  mongodump --username admin --password changeme123 \
  --authenticationDatabase admin \
  --out /backups/mongodb_manual

# Copy from container
docker cp livestock-mongodb-prod:/backups/mongodb_manual ./backups/

# Compress
tar -czf backups/mongodb_manual.tar.gz backups/mongodb_manual
```

### Restore from Backup

```bash
# Extract backup
tar -xzf backups/mongodb_20240107_020000.tar.gz -C backups/

# Copy to container
docker cp backups/mongodb_20240107_020000 livestock-mongodb-prod:/backups/

# Restore
docker compose -f docker-compose.prod.yml exec mongodb \
  mongorestore --username admin --password changeme123 \
  --authenticationDatabase admin \
  /backups/mongodb_20240107_020000
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check specific service
docker compose -f docker-compose.prod.yml logs backend

# Restart service
docker compose -f docker-compose.prod.yml restart backend

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build backend
```

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker compose -f docker-compose.prod.yml ps mongodb

# Check MongoDB logs
docker compose -f docker-compose.prod.yml logs mongodb

# Test connection
docker compose -f docker-compose.prod.yml exec mongodb \
  mongosh -u admin -p changeme123 --authenticationDatabase admin

# Restart MongoDB
docker compose -f docker-compose.prod.yml restart mongodb
```

### Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:3001/

# Check CORS settings in .env
cat .env | grep CORS

# Check frontend environment
docker compose -f docker-compose.prod.yml exec frontend env | grep NEXT_PUBLIC

# Rebuild frontend with correct env
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### IoT Devices Can't Connect

```bash
# Check MQTT broker
docker compose -f docker-compose.prod.yml logs mosquitto

# Test MQTT connection
mosquitto_sub -h localhost -t "test" -v

# Check firewall
sudo ufw status | grep 1883

# Check device can reach server
# From device network: ping YOUR_SERVER_IP
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker compose -f docker-compose.prod.yml restart

# Increase memory limits in docker-compose.prod.yml
# Add under service:
#   deploy:
#     resources:
#       limits:
#         memory: 2G
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.prod.yml build --no-cache

# Restart services (zero-downtime)
docker compose -f docker-compose.prod.yml up -d
```

### Update Docker Images

```bash
# Pull latest base images
docker compose -f docker-compose.prod.yml pull

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (careful!)
docker system prune -a --volumes
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up logs
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Restart Docker
sudo systemctl restart docker

# Restart services
docker compose -f docker-compose.prod.yml restart
```

## Performance Tuning

### MongoDB Optimization

```bash
# Add indexes (already in code, but verify)
docker compose -f docker-compose.prod.yml exec mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin

use livestock_db
db.devices.getIndexes()
db.gasSensorReadings.getIndexes()
```

### Redis Optimization

```bash
# Check Redis memory
docker compose -f docker-compose.prod.yml exec redis redis-cli INFO memory

# Set max memory (in docker-compose.prod.yml)
# command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Nginx Optimization

Already configured in `nginx/nginx.conf`:
- Gzip compression
- Static file caching
- Rate limiting
- Connection pooling

## Support

### Documentation
- Main README: `README.md`
- Hardware Guide: `packages/simulator/hardware/`
- API Documentation: `packages/backend/README.md`

### Community
- GitHub Issues: [repository-url]
- Email: support@livestock-monitoring.com

### Commercial Support
- Enterprise support available
- Custom development
- Training and consultation

---

**Production deployment complete! 🎉**

Your Livestock IoT Monitoring System is now ready for real-world use with ESP32/Arduino devices.
