# 🐄 Sistem Pemantauan Ternak IoT

Sistem monitoring real-time untuk peternakan menggunakan sensor gas dan RFID reader untuk tracking kesehatan kandang dan pergerakan ternak.

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Arsitektur](#-arsitektur)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Dokumentasi](#-dokumentasi)
- [Screenshots](#-screenshots)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Fitur Utama

### 🌡️ Monitoring Gas Real-time
- Pemantauan level Methane (CH4), CO2, dan Ammonia (NH3)
- Alert otomatis saat level gas berbahaya
- Visualisasi data sensor real-time via WebSocket
- Historical data dan trend analysis

### 🏷️ Tracking Ternak dengan RFID
- Entry/Exit logging otomatis
- Tracking lokasi ternak per kandang
- QR Code untuk akses informasi ternak
- Riwayat pergerakan lengkap

### 📊 Dashboard & Analytics
- Statistik ternak (total, aktif, terjual, mati)
- Okupansi kandang real-time
- Aktivitas terkini
- Distribusi ternak per spesies

### 🔔 Sistem Alert
- Alert multi-level (info, warning, critical)
- Email notifications
- Status tracking (active, acknowledged, resolved)
- Filter dan search alerts

### 🔧 Device Management
- Auto-registration IoT devices
- Real-time device status monitoring
- Heartbeat tracking
- Error logging dan diagnostics
- Uptime statistics

### 👥 User Management
- Role-based access (Admin, Farmer)
- JWT authentication
- Protected routes
- User profile management

## 🛠 Teknologi

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB
- **Cache**: Redis
- **MQTT Broker**: Mosquitto
- **Real-time**: Socket.IO (WebSocket)
- **Authentication**: JWT
- **Validation**: class-validator, class-transformer
- **Testing**: Jest

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.IO Client
- **Charts**: Recharts
- **QR Scanner**: @zxing/library
- **HTTP Client**: Axios

### IoT Simulator
- **Language**: Python 3
- **MQTT Client**: paho-mqtt
- **HTTP Client**: requests

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Message Broker**: Mosquitto MQTT
- **Database**: MongoDB
- **Cache**: Redis

## 🏗 Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Livestock │  │ Devices  │  │Monitoring│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────┴────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   MQTT   │  │WebSocket │  │  Alerts  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Livestock │  │  Barns   │  │ Devices  │  │   Logs   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────┬───────────────┬──────────────┬────────────────────┘
         │               │              │
    ┌────┴────┐    ┌────┴────┐    ┌───┴────┐
    │ MongoDB │    │  Redis  │    │Mosquitto│
    └─────────┘    └─────────┘    └────┬────┘
                                        │ MQTT
                                   ┌────┴────┐
                                   │IoT Devices│
                                   │Simulators │
                                   └──────────┘
```

## 📦 Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.8
- **Docker** & Docker Compose
- **npm** atau **yarn**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd livestock-monitoring-system
```

### 2. Setup Infrastructure (Docker)

```bash
# Start MongoDB, Redis, dan Mosquitto
docker-compose up -d

# Verify services are running
docker ps
```

### 3. Setup Backend

```bash
cd packages/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env dengan konfigurasi Anda
# MONGODB_URI=mongodb://localhost:27017/livestock
# REDIS_HOST=localhost
# MQTT_BROKER_URL=mqtt://localhost:1883
# JWT_SECRET=your-secret-key

# Run database migrations/seed
npm run seed

# Start development server
npm run start:dev
```

Backend akan berjalan di `http://localhost:3001`

### 4. Setup Frontend

```bash
cd packages/frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_WS_URL=http://localhost:3001

# Start development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

### 5. Setup Simulator (Optional)

```bash
cd packages/simulator

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env

# Start gas sensor simulator
python gas_sensor_simulator.py

# In another terminal, start RFID reader simulator
python rfid_reader_simulator.py
```

### 6. Login ke Aplikasi

Buka browser dan akses `http://localhost:3000`

**Default Admin Credentials:**
- Email: `admin@livestock.com`
- Password: `admin123`

**Default Farmer Credentials:**
- Email: `farmer@livestock.com`
- Password: `farmer123`

## 📚 Dokumentasi

### Backend Documentation
- [Device Management](packages/backend/DEVICE-MANAGEMENT.md) - Device tracking dan monitoring
- [Auto Device Registration](packages/backend/AUTO-DEVICE-REGISTRATION.md) - Auto-registration system
- [E2E Testing](packages/backend/test/E2E-TESTING.md) - Integration testing guide
- [API Documentation](packages/backend/README.md) - REST API endpoints

### Frontend Documentation
- [Translation Summary](packages/frontend/TRANSLATION-SUMMARY.md) - Bahasa Indonesia translation
- [Responsive Design](packages/frontend/RESPONSIVE_DESIGN_VERIFICATION.md) - Mobile responsiveness

### Simulator Documentation
- [Simulator README](packages/simulator/README.md) - IoT simulator overview
- [Implementation Guide](packages/simulator/IMPLEMENTATION.md) - Technical implementation
- [Usage Guide](packages/simulator/USAGE.md) - How to use simulators
- [Device Integration](packages/simulator/DEVICE-MANAGEMENT-INTEGRATION.md) - Device management integration

### Hardware Implementation (ESP32/Arduino)
- [Hardware Overview](packages/simulator/hardware/README.md) - Hardware requirements dan setup
- [Wiring Guide](packages/simulator/hardware/WIRING_GUIDE.md) - Panduan lengkap wiring
- [Calibration Guide](packages/simulator/hardware/CALIBRATION_GUIDE.md) - Kalibrasi sensor
- [Deployment Checklist](packages/simulator/hardware/DEPLOYMENT_CHECKLIST.md) - Checklist deployment
- [FAQ](packages/simulator/hardware/FAQ.md) - Pertanyaan umum
- [Quick Reference](packages/simulator/hardware/QUICK_REFERENCE.md) - Referensi cepat untuk teknisi
- [Code Examples](packages/simulator/hardware/) - ESP32 dan Arduino code

### Specifications
- [Requirements](/.kiro/specs/livestock-monitoring-system/requirements.md) - System requirements
- [Design](/.kiro/specs/livestock-monitoring-system/design.md) - System design
- [Tasks](/.kiro/specs/livestock-monitoring-system/tasks.md) - Development tasks

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Real-time dashboard dengan statistik ternak dan aktivitas terkini*

### Monitoring Real-time
![Monitoring](docs/screenshots/monitoring.png)
*Pemantauan sensor gas real-time dengan alert levels*

### Device Management
![Devices](docs/screenshots/devices.png)
*Management dan monitoring IoT devices*

### Livestock Management
![Livestock](docs/screenshots/livestock.png)
*Manajemen data ternak dengan filtering dan search*

## 🧪 Testing

### Backend Tests

```bash
cd packages/backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests

```bash
cd packages/frontend

# Run tests
npm run test

# Test with coverage
npm run test:coverage
```

### Simulator Tests

```bash
cd packages/simulator

# Run batch test (10 events)
python gas_sensor_simulator.py --batch 10
python rfid_reader_simulator.py --batch 10
```

## 🔧 Development

### Project Structure

```
livestock-monitoring-system/
├── packages/
│   ├── backend/          # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── schemas/  # MongoDB schemas
│   │   │   ├── common/   # Shared utilities
│   │   │   └── config/   # Configuration
│   │   └── test/         # Tests
│   │
│   ├── frontend/         # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/ # React components
│   │   │   ├── stores/   # Zustand stores
│   │   │   └── lib/      # Utilities
│   │   └── public/       # Static assets
│   │
│   └── simulator/        # Python IoT simulators
│       ├── gas_sensor_simulator.py
│       ├── rfid_reader_simulator.py
│       └── main.py
│
├── docker-compose.yml    # Docker services
├── mosquitto/           # MQTT broker config
└── README.md           # This file
```

### Environment Variables

#### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/livestock

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=livestock-backend

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

#### Simulator (.env)
```bash
# Backend API
BACKEND_API_URL=http://localhost:3001
ADMIN_EMAIL=admin@livestock.com
ADMIN_PASSWORD=admin123

# MQTT
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883

# Simulator settings
NUM_GAS_SENSORS=3
GAS_SENSOR_INTERVAL=10
RFID_EVENT_INTERVAL=30
```

## 🚢 Deployment

### Production Build

#### Backend
```bash
cd packages/backend
npm run build
npm run start:prod
```

#### Frontend
```bash
cd packages/frontend
npm run build
npm run start
```

### Docker Deployment

```bash
# Build and run all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment-specific Configurations

- **Development**: `.env`, `.env.local`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Input validation dan sanitization
- Rate limiting
- CORS configuration
- Environment variable protection

## 🐛 Troubleshooting

### Backend tidak bisa connect ke MongoDB
```bash
# Check MongoDB is running
docker ps | grep mongo

# Restart MongoDB
docker-compose restart mongodb
```

### Frontend tidak bisa connect ke Backend
```bash
# Check backend is running
curl http://localhost:3001/

# Check CORS settings in backend
# Verify NEXT_PUBLIC_API_URL in .env.local
```

### Simulator tidak bisa connect ke MQTT
```bash
# Check Mosquitto is running
docker ps | grep mosquitto

# Test MQTT connection
mosquitto_sub -h localhost -t "test" -v
```

### Devices tidak muncul di frontend
```bash
# Check backend logs for auto-registration
# Verify simulator is sending status messages
# Check MQTT topics are correct
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/profile` - Get profile

### Livestock
- `GET /api/livestock` - List livestock
- `POST /api/livestock` - Create livestock
- `GET /api/livestock/:id` - Get livestock
- `PUT /api/livestock/:id` - Update livestock
- `DELETE /api/livestock/:id` - Delete livestock

### Barns
- `GET /api/barns` - List barns
- `POST /api/barns` - Create barn
- `GET /api/barns/:id` - Get barn
- `PUT /api/barns/:id` - Update barn

### Devices
- `GET /api/devices` - List devices
- `GET /api/devices/:id` - Get device
- `GET /api/devices/:id/statistics` - Device statistics
- `GET /api/devices/:id/logs` - Device logs

### Monitoring
- `GET /api/monitoring/latest` - Latest sensor readings
- `GET /api/monitoring/barn/:barnId` - Barn sensor data

### Alerts
- `GET /api/alerts` - List alerts
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/alerts/:id/resolve` - Resolve alert

### Logs
- `GET /api/logs` - Entry/exit logs
- `POST /api/logs` - Create log entry

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Ghifari Nafhan** - *Initial work*

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Next.js team for the React framework
- MongoDB team for the database
- Eclipse Mosquitto for MQTT broker
- All contributors and testers

## 📞 Support

For support, email nafhanghifari@gmail.com
---

Made with ❤️ for better livestock management
