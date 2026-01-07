# End-to-End Integration Testing

This document describes the E2E integration tests for the Livestock IoT Monitoring System.

## Overview

The E2E tests verify the complete system flows:

1. **Authentication Flow**: User login, token refresh, profile access
2. **Farm Setup**: Creating and managing farms
3. **Barn Management**: Creating barns, assigning sensors
4. **Livestock Management**: CRUD operations, QR codes
5. **RFID Entry/Exit Flow**: Tracking livestock movement through barns
6. **Gas Sensor MQTT Flow**: Processing sensor data, creating alerts
7. **WebSocket Real-time Updates**: Verifying real-time event broadcasting
8. **Dashboard Statistics**: Aggregated data retrieval
9. **Public QR Code Access**: Unauthenticated livestock information access
10. **Error Handling**: Validation and error scenarios

## Prerequisites

Before running E2E tests, ensure the following services are running:

1. **MongoDB** (port 27017)
2. **Redis** (port 6379)
3. **Mosquitto MQTT Broker** (port 1883)

You can start these services using Docker Compose:

```bash
# From the project root
docker-compose up -d mongodb redis mosquitto
```

## Running the Tests

### Run all E2E tests

```bash
cd packages/backend
npm run test:e2e
```

### Run specific test file

```bash
cd packages/backend
npm run test:e2e -- integration.e2e-spec.ts
```

### Run with verbose output

```bash
cd packages/backend
npm run test:e2e -- --verbose
```

## Test Environment

The tests use a separate test database (`livestock_db_test`) to avoid interfering with development data. The test environment is configured in `.env.test`.

### Environment Variables

- `NODE_ENV=test`
- `PORT=3002` (different from dev port)
- `MONGODB_URI=mongodb://admin:password123@localhost:27017/livestock_db_test?authSource=admin`

## Test Flow Details

### 1. Sensor → Backend → Frontend Flow

```
ESP32/Simulator → MQTT (sensors/gas/{sensorId}) → Backend MQTT Handler
  → Store in MongoDB → Calculate Alert Level → Create Alert (if danger)
  → Broadcast via WebSocket → Frontend receives real-time update
```

**Test Coverage:**
- Normal gas readings are stored correctly
- Dangerous readings trigger alert creation
- Alert level calculation follows thresholds
- WebSocket broadcasts sensor readings to subscribed clients

### 2. RFID → Backend → Frontend Flow

```
RFID Reader → HTTP POST /api/logs → Backend Entry/Exit Service
  → Validate livestock/barn → Create log → Update livestock location
  → Calculate duration (for exit) → Broadcast via WebSocket
  → Frontend receives real-time update
```

**Test Coverage:**
- Entry logs update livestock current barn
- Exit logs calculate duration correctly
- Barn occupancy is updated
- WebSocket broadcasts entry/exit events

### 3. WebSocket Real-time Updates

```
Client connects → Subscribe to barn room → Backend emits events
  → Client receives: sensor readings, entry/exit events, alerts
```

**Test Coverage:**
- Clients can subscribe to barn-specific rooms
- Sensor readings are broadcast in real-time
- Entry/exit events are broadcast in real-time
- Alerts are broadcast globally

## Test Data Cleanup

The tests automatically clean up after themselves:
- Test database is dropped after all tests complete
- MQTT client is disconnected
- WebSocket client is disconnected
- Application is closed

## Troubleshooting

### Tests fail with "ECONNREFUSED"

**Cause:** Required services (MongoDB, Redis, or Mosquitto) are not running.

**Solution:**
```bash
docker-compose up -d mongodb redis mosquitto
```

### Tests timeout

**Cause:** Services are slow to respond or WebSocket connection issues.

**Solution:**
- Increase test timeout in `jest-e2e.json` (currently 30000ms)
- Check service health: `docker-compose ps`
- Check service logs: `docker-compose logs mongodb redis mosquitto`

### Database connection errors

**Cause:** MongoDB authentication or connection issues.

**Solution:**
- Verify MongoDB is running: `docker-compose ps mongodb`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify connection string in `.env.test`

### MQTT connection errors

**Cause:** Mosquitto broker not running or port conflict.

**Solution:**
- Verify Mosquitto is running: `docker-compose ps mosquitto`
- Check Mosquitto logs: `docker-compose logs mosquitto`
- Verify port 1883 is not in use: `lsof -i :1883`

## Adding New Tests

When adding new E2E tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Clean up test data in `afterAll` hook
4. Use proper async/await patterns
5. Add appropriate timeouts for async operations
6. Document the flow being tested

## CI/CD Integration

For CI/CD pipelines, ensure:

1. Services are started before tests
2. Test database is isolated
3. Proper cleanup after tests
4. Test results are captured
5. Coverage reports are generated

Example GitHub Actions workflow:

```yaml
- name: Start services
  run: docker-compose up -d mongodb redis mosquitto

- name: Wait for services
  run: sleep 10

- name: Run E2E tests
  run: cd packages/backend && npm run test:e2e

- name: Stop services
  run: docker-compose down
```

## Performance Considerations

- Tests use a separate port (3002) to avoid conflicts
- Database operations use indexes for faster queries
- MQTT messages are processed asynchronously
- WebSocket tests have appropriate timeouts
- Test database is dropped (not cleaned) for speed

## Security Notes

- Test environment uses separate credentials
- Test JWT secrets are different from production
- Test database is isolated from development/production
- Email notifications are mocked in tests
