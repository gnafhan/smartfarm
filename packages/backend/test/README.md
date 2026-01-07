# Backend Testing Documentation

## Overview

This directory contains all test files for the Livestock IoT Monitoring System backend.

## Test Types

### 1. Unit Tests (`*.spec.ts`)
- Located alongside source files in `src/` directory
- Test individual functions, services, and components in isolation
- Run with: `npm test`

### 2. End-to-End (E2E) Tests (`*.e2e-spec.ts`)
- Located in `test/` directory
- Test complete system flows and integrations
- Run with: `npm run test:e2e`

## E2E Test Files

### `integration.e2e-spec.ts`
Comprehensive integration tests covering:
- Authentication flow (login, token refresh, profile access)
- Farm and barn management
- Livestock CRUD operations
- RFID entry/exit tracking
- Gas sensor MQTT message processing
- WebSocket real-time updates
- Dashboard statistics
- Public QR code access
- Error handling and validation

### `app.e2e-spec.ts`
Basic application health check test.

## Running Tests

### Prerequisites

Ensure Docker services are running:
```bash
docker compose up -d mongodb redis mosquitto
```

### Run All E2E Tests
```bash
cd packages/backend
npm run test:e2e
```

### Run Specific Test File
```bash
npm run test:e2e -- integration.e2e-spec.ts
```

### Run with Verbose Output
```bash
npm run test:e2e -- --verbose
```

### Run with Open Handle Detection
```bash
npm run test:e2e -- --detectOpenHandles
```

## Test Configuration

### `jest-e2e.json`
Jest configuration for E2E tests:
- Test timeout: 30 seconds
- Test environment: Node.js
- Transform: TypeScript via ts-jest
- Setup file: `jest-e2e.setup.ts`

### `.env.test`
Test environment configuration:
- Separate test database (`livestock_db_test`)
- Test port (3002)
- Test JWT secrets
- Mock email configuration

### `jest-e2e.setup.ts`
Setup file that loads test environment variables before tests run.

## Test Results

See `E2E-TEST-RESULTS.md` for detailed test execution results and analysis.

## Documentation

- **E2E-TESTING.md**: Comprehensive guide to E2E testing
- **E2E-TEST-RESULTS.md**: Latest test execution results and analysis
- **README.md**: This file

## Test Data Management

### Setup
- Tests create their own test data in `beforeAll` hooks
- Each test suite is independent

### Cleanup
- Test database is dropped in `afterAll` hooks
- MQTT and WebSocket connections are closed
- Application is properly shut down

## Troubleshooting

### Services Not Running
```bash
docker compose ps
docker compose up -d mongodb redis mosquitto
```

### Connection Errors
```bash
# Check service logs
docker compose logs mongodb
docker compose logs redis
docker compose logs mosquitto
```

### Port Conflicts
```bash
# Check if ports are in use
lsof -i :27017  # MongoDB
lsof -i :6379   # Redis
lsof -i :1883   # Mosquitto
lsof -i :3002   # Test server
```

### Test Timeouts
- Increase timeout in `jest-e2e.json`
- Check service health
- Verify network connectivity

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Async**: Use proper async/await patterns
4. **Timeouts**: Set appropriate timeouts for async operations
5. **Logging**: Add logging for debugging
6. **Documentation**: Document test flows and expectations

## CI/CD Integration

For continuous integration:

1. Start services before tests
2. Wait for services to be healthy
3. Run tests with appropriate timeout
4. Capture test results and coverage
5. Clean up services after tests

Example:
```bash
docker compose up -d mongodb redis mosquitto
sleep 10  # Wait for services
npm run test:e2e
docker compose down
```

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names
3. Add proper setup and cleanup
4. Document complex test scenarios
5. Update this README if needed
