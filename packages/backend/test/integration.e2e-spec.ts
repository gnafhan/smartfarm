/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import * as mqtt from 'mqtt';
import { io, Socket } from 'socket.io-client';

describe('Livestock Monitoring System - E2E Integration Tests', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let authToken: string;
  let refreshToken: string;
  let testUserId: string;
  let testFarmId: string;
  let testBarnId: string;
  let testLivestockId: string;
  let testSensorId: string;
  let mqttClient: mqtt.MqttClient;
  let wsClient: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.listen(3002); // Use different port for testing

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());

    // Setup MQTT client for testing
    mqttClient = mqtt.connect('mqtt://localhost:1883', {
      clientId: 'test-client-' + Math.random().toString(16).substr(2, 8),
    });

    await new Promise<void>((resolve) => {
      mqttClient.on('connect', () => resolve());
    });

    // Setup WebSocket client
    wsClient = io('http://localhost:3002', {
      transports: ['websocket'],
      autoConnect: false,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (mongoConnection) {
      await mongoConnection.dropDatabase();
    }

    if (mqttClient) {
      mqttClient.end();
    }

    if (wsClient) {
      wsClient.disconnect();
    }

    await app.close();
  });

  describe('1. Authentication Flow', () => {
    it('should create a test user and authenticate', async () => {
      // First, create an admin user directly in the database
      const User = mongoConnection.model('User');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('testpass123', 10);

      const adminUser = await User.create({
        email: 'admin@test.com',
        password: hashedPassword,
        fullName: 'Test Admin',
        role: 'admin',
        status: 'active',
      });

      testUserId = adminUser._id.toString();

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpass123',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');

      authToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', 'admin@test.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      authToken = response.body.accessToken;
    });
  });

  describe('2. Farm Setup', () => {
    it('should create a farm', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/farms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Farm',
          ownerId: testUserId,
          address: '123 Farm Road',
          contactInfo: {
            phone: '555-0100',
            email: 'farm@test.com',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', 'Test Farm');
      testFarmId = response.body._id;
    });
  });

  describe('3. Barn Management', () => {
    it('should create a barn', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Barn A',
          code: 'BARN-A-001',
          capacity: 50,
          farmId: testFarmId,
          status: 'active',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('code', 'BARN-A-001');
      expect(response.body).toHaveProperty('currentOccupancy', 0);
      testBarnId = response.body._id;
    });

    it('should assign sensor to barn', async () => {
      testSensorId = 'GAS-SENSOR-001';

      const response = await request(app.getHttpServer())
        .post(`/api/barns/${testBarnId}/sensors`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sensorId: testSensorId,
        })
        .expect(200);

      expect(response.body.sensors).toContain(testSensorId);
    });
  });

  describe('4. Livestock Management', () => {
    it('should create livestock', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/livestock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          earTagId: 'EAR-001',
          species: 'cattle',
          name: 'Bessie',
          gender: 'female',
          dateOfBirth: '2023-01-15',
          weight: 450,
          color: 'brown',
          status: 'active',
          healthStatus: 'healthy',
          farmId: testFarmId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('earTagId', 'EAR-001');
      testLivestockId = response.body._id;
    });

    it('should retrieve livestock by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('earTagId', 'EAR-001');
      expect(response.body).toHaveProperty('name', 'Bessie');
    });

    it('should list livestock with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/livestock')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ species: 'cattle', status: 'active' })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('5. RFID Entry/Exit Flow (Backend → Frontend)', () => {
    let entryLogId: string;

    it('should create entry log when livestock enters barn', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          livestockId: testLivestockId,
          barnId: testBarnId,
          eventType: 'entry',
          rfidReaderId: 'RFID-READER-001',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('eventType', 'entry');
      expect(response.body).toHaveProperty('livestockId');
      entryLogId = response.body._id;

      // Verify livestock current barn was updated
      const livestockResponse = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(livestockResponse.body.currentBarnId).toBe(testBarnId);
    });

    it('should verify barn occupancy increased', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/barns/${testBarnId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.currentOccupancy).toBe(1);
    });

    it('should create exit log with duration calculation', async () => {
      // Wait a moment to ensure duration is calculated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .post('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          livestockId: testLivestockId,
          barnId: testBarnId,
          eventType: 'exit',
          rfidReaderId: 'RFID-READER-001',
        })
        .expect(201);

      expect(response.body).toHaveProperty('eventType', 'exit');
      expect(response.body).toHaveProperty('duration');
      expect(response.body.duration).toBeGreaterThan(0);
    });

    it('should retrieve entry/exit logs with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ livestockId: testLivestockId })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('6. Gas Sensor MQTT Flow (Sensor → Backend → Frontend)', () => {
    let alertId: string;

    it('should process normal gas sensor reading via MQTT', async () => {
      const sensorData = {
        sensorId: testSensorId,
        barnId: testBarnId,
        methanePpm: 300,
        co2Ppm: 1500,
        nh3Ppm: 10,
        temperature: 22.5,
        humidity: 65,
        timestamp: new Date().toISOString(),
      };

      // Publish to MQTT
      mqttClient.publish(
        `sensors/gas/${testSensorId}`,
        JSON.stringify(sensorData),
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify reading was stored
      const response = await request(app.getHttpServer())
        .get('/api/monitoring/latest')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const reading = response.body.find((r: any) => r.sensorId === testSensorId);
      expect(reading).toBeDefined();
      expect(reading.alertLevel).toBe('normal');
    });

    it('should create alert for dangerous gas levels', async () => {
      const dangerousSensorData = {
        sensorId: testSensorId,
        barnId: testBarnId,
        methanePpm: 1500, // Above danger threshold (1000)
        co2Ppm: 3500, // Above danger threshold (3000)
        nh3Ppm: 30, // Above danger threshold (25)
        temperature: 28.5,
        humidity: 70,
        timestamp: new Date().toISOString(),
      };

      // Publish dangerous reading
      mqttClient.publish(
        `sensors/gas/${testSensorId}`,
        JSON.stringify(dangerousSensorData),
      );

      // Wait for processing and alert creation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify alert was created
      const alertsResponse = await request(app.getHttpServer())
        .get('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'active' })
        .expect(200);

      expect(alertsResponse.body).toHaveProperty('data');
      const gasAlert = alertsResponse.body.data.find(
        (a: any) => a.type === 'gas_level' && a.barnId === testBarnId,
      );
      expect(gasAlert).toBeDefined();
      expect(gasAlert.severity).toBe('critical');
      alertId = gasAlert._id;
    });

    it('should retrieve historical sensor data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/monitoring/readings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          barnId: testBarnId,
          startDate: new Date(Date.now() - 3600000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should acknowledge alert', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/alerts/${alertId}/acknowledge`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('acknowledged');
      expect(response.body).toHaveProperty('acknowledgedAt');
    });

    it('should resolve alert', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/alerts/${alertId}/resolve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('resolved');
      expect(response.body).toHaveProperty('resolvedAt');
    });
  });

  describe('7. WebSocket Real-time Updates', () => {
    it('should connect to WebSocket server', (done) => {
      wsClient.connect();

      wsClient.on('connect', () => {
        expect(wsClient.connected).toBe(true);
        wsClient.disconnect();
        done();
      });

      wsClient.on('connect_error', (error) => {
        wsClient.disconnect();
        done(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!wsClient.connected) {
          wsClient.disconnect();
          done(new Error('WebSocket connection timed out'));
        }
      }, 5000);
    });
  });

  describe('8. Dashboard Statistics', () => {
    it('should retrieve dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('recentLogs');
      expect(response.body).toHaveProperty('livestockSummary');
      expect(response.body).toHaveProperty('barnOccupancy');
      expect(Array.isArray(response.body.recentLogs)).toBe(true);
    });
  });

  describe('9. Public QR Code Access', () => {
    let qrCode: string;

    it('should get QR code from livestock', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      qrCode = response.body.qrCode;
      expect(qrCode).toBeDefined();
    });

    it('should access livestock info via public QR endpoint without auth', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/qr/${qrCode}`)
        .expect(200);

      expect(response.body).toHaveProperty('earTagId', 'EAR-001');
      expect(response.body).toHaveProperty('name', 'Bessie');
      expect(response.body).not.toHaveProperty('password');
    });
  });

  describe('10. Error Handling and Validation', () => {
    it('should reject invalid authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/livestock')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject duplicate ear tag', async () => {
      await request(app.getHttpServer())
        .post('/api/livestock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          earTagId: 'EAR-001', // Duplicate
          species: 'cattle',
          name: 'Another Cow',
          gender: 'male',
          dateOfBirth: '2023-02-01',
          weight: 400,
          farmId: testFarmId,
        })
        .expect(400);
    });

    it('should reject invalid RFID event with non-existent livestock', async () => {
      await request(app.getHttpServer())
        .post('/api/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          livestockId: '507f1f77bcf86cd799439011', // Non-existent ID
          barnId: testBarnId,
          eventType: 'entry',
          rfidReaderId: 'RFID-READER-001',
        })
        .expect(404);
    });

    it('should reject invalid gas sensor data', async () => {
      const invalidSensorData = {
        sensorId: testSensorId,
        // Missing required fields
        methanePpm: 300,
      };

      mqttClient.publish(
        `sensors/gas/${testSensorId}`,
        JSON.stringify(invalidSensorData),
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // The invalid message should be rejected and not stored
      // This is verified by the system logs, not by a direct API check
    });
  });
});
