import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Weight Entries API - E2E Tests', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let authToken: string;
  let testUserId: string;
  let testFarmId: string;
  let testLivestockId: string;
  let testWeightEntryId: string;

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
    await app.listen(3004); // Use different port for testing

    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    // Cleanup test data
    if (mongoConnection) {
      await mongoConnection.dropDatabase();
    }

    await app.close();
  });

  describe('Setup', () => {
    it('should create test user and authenticate', async () => {
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

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpass123',
        })
        .expect(200);

      authToken = loginResponse.body.accessToken;
    });

    it('should create test farm', async () => {
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

      testFarmId = response.body._id;
    });

    it('should create test livestock', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/livestock')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          earTagId: 'EAR-TEST-002',
          species: 'cattle',
          name: 'Test Cow 2',
          gender: 'female',
          dateOfBirth: '2023-01-15',
          weight: 450,
          color: 'brown',
          status: 'active',
          healthStatus: 'healthy',
          farmId: testFarmId,
        })
        .expect(201);

      testLivestockId = response.body._id;
    });
  });

  describe('Weight Entries CRUD', () => {
    it('should create a weight entry (POST /livestock/:livestockId/weight-entries)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 450.5,
          measurementDate: '2024-01-15T10:00:00Z',
          notes: 'Initial weight measurement',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.weight).toBe(450.5);
      expect(response.body.notes).toBe('Initial weight measurement');
      testWeightEntryId = response.body.id;
    });

    it('should reject negative weight', async () => {
      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: -10,
          measurementDate: '2024-01-15T10:00:00Z',
        })
        .expect(400);
    });

    it('should reject zero weight', async () => {
      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 0,
          measurementDate: '2024-01-15T10:00:00Z',
        })
        .expect(400);
    });

    it('should reject future measurement date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 460,
          measurementDate: futureDate.toISOString(),
        })
        .expect(400);
    });

    it('should get all weight entries for livestock (GET /livestock/:livestockId/weight-entries)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('should get latest weight entry (GET /livestock/:livestockId/weight-entries/latest)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries/latest`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.weight).toBe(450.5);
    });

    it('should get a single weight entry (GET /livestock/:livestockId/weight-entries/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries/${testWeightEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testWeightEntryId);
      expect(response.body.weight).toBe(450.5);
    });

    it('should update a weight entry (PATCH /livestock/:livestockId/weight-entries/:id)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/livestock/${testLivestockId}/weight-entries/${testWeightEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 455.0,
          notes: 'Updated weight measurement',
        })
        .expect(200);

      expect(response.body.weight).toBe(455.0);
      expect(response.body.notes).toBe('Updated weight measurement');
    });

    it('should delete a weight entry (DELETE /livestock/:livestockId/weight-entries/:id)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/livestock/${testLivestockId}/weight-entries/${testWeightEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries/${testWeightEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent livestock', async () => {
      await request(app.getHttpServer())
        .post('/api/livestock/507f1f77bcf86cd799439011/weight-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 450,
          measurementDate: '2024-01-15T10:00:00Z',
        })
        .expect(404);
    });
  });

  describe('Chart Data Endpoint', () => {
    it('should return chart data with correct structure (GET /livestock/:livestockId/weight-entries/chart-data)', async () => {
      // First create some weight entries
      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 470,
          measurementDate: '2024-04-01T10:00:00Z',
          notes: 'Chart test measurement',
        });

      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries/chart-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify structure matches WeightChartDataDto
      expect(response.body).toHaveProperty('weightData');
      expect(response.body).toHaveProperty('temperatureData');
      expect(response.body).toHaveProperty('methaneData');

      // Verify weightData is an array
      expect(Array.isArray(response.body.weightData)).toBe(true);
      expect(Array.isArray(response.body.temperatureData)).toBe(true);
      expect(Array.isArray(response.body.methaneData)).toBe(true);

      // If there's weight data, verify structure
      if (response.body.weightData.length > 0) {
        const firstWeight = response.body.weightData[0];
        expect(firstWeight).toHaveProperty('date');
        expect(firstWeight).toHaveProperty('weight');
        expect(typeof firstWeight.weight).toBe('number');
      }
    });

    it('should filter chart data by date range', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries/chart-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-04-01T00:00:00Z',
          endDate: '2024-04-30T23:59:59Z',
        })
        .expect(200);

      expect(response.body).toHaveProperty('weightData');
      expect(Array.isArray(response.body.weightData)).toBe(true);
    });

    it('should handle missing environmental data gracefully', async () => {
      // Even if livestock has no barn or barn has no sensors, should still return weight data
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries/chart-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should have empty arrays for environmental data if not available
      expect(response.body).toHaveProperty('temperatureData');
      expect(response.body).toHaveProperty('methaneData');
      expect(Array.isArray(response.body.temperatureData)).toBe(true);
      expect(Array.isArray(response.body.methaneData)).toBe(true);
    });
  });

  describe('Pagination and Filtering', () => {
    beforeAll(async () => {
      // Create multiple weight entries for testing
      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 460,
          measurementDate: '2024-02-01T10:00:00Z',
          notes: 'Second measurement',
        });

      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          weight: 465,
          measurementDate: '2024-03-01T10:00:00Z',
          notes: 'Third measurement',
        });
    });

    it('should paginate weight entries', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });

    it('should filter weight entries by date range', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/weight-entries`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-02-01T00:00:00Z',
          endDate: '2024-03-31T23:59:59Z',
        })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      response.body.data.forEach((entry: any) => {
        const entryDate = new Date(entry.measurementDate);
        expect(entryDate >= new Date('2024-02-01')).toBe(true);
        expect(entryDate <= new Date('2024-03-31')).toBe(true);
      });
    });
  });
});
