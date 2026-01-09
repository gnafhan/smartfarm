import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Health Events API - E2E Tests', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let authToken: string;
  let testUserId: string;
  let testFarmId: string;
  let testLivestockId: string;
  let testHealthEventId: string;

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
    await app.listen(3003); // Use different port for testing

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
          earTagId: 'EAR-TEST-001',
          species: 'cattle',
          name: 'Test Cow',
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

  describe('Health Events CRUD', () => {
    it('should create a vaccination event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'vaccination',
          eventDate: '2024-01-15T10:00:00Z',
          description: 'Annual vaccination',
          vaccineName: 'Bovine Vaccine A',
          nextDueDate: '2025-01-15T10:00:00Z',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.eventType).toBe('vaccination');
      expect(response.body.vaccineName).toBe('Bovine Vaccine A');
      testHealthEventId = response.body._id;
    });

    it('should create an examination event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'examination',
          eventDate: '2024-02-01T14:00:00Z',
          description: 'Routine checkup',
          veterinarianName: 'Dr. Smith',
          findings: 'Animal is healthy, no issues found',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.eventType).toBe('examination');
      expect(response.body.veterinarianName).toBe('Dr. Smith');
    });

    it('should create a disease event', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'disease',
          eventDate: '2024-03-01T09:00:00Z',
          description: 'Diagnosed with minor infection',
          diseaseName: 'Bacterial Infection',
          severity: 'mild',
          treatmentPlan: 'Antibiotics for 7 days',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.eventType).toBe('disease');
      expect(response.body.diseaseName).toBe('Bacterial Infection');
      expect(response.body.severity).toBe('mild');
    });

    it('should reject future event date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'vaccination',
          eventDate: futureDate.toISOString(),
          description: 'Future vaccination',
          vaccineName: 'Test Vaccine',
        })
        .expect(400);
    });

    it('should reject vaccination without vaccine name', async () => {
      await request(app.getHttpServer())
        .post(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'vaccination',
          eventDate: '2024-01-15T10:00:00Z',
          description: 'Vaccination without name',
          // Missing vaccineName
        })
        .expect(400);
    });

    it('should get all health events for livestock', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('should filter health events by type', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ eventType: 'vaccination' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      response.body.data.forEach((event: any) => {
        expect(event.eventType).toBe('vaccination');
      });
    });

    it('should get a single health event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/health-events/${testHealthEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(testHealthEventId);
      expect(response.body.eventType).toBe('vaccination');
    });

    it('should update a health event', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/livestock/${testLivestockId}/health-events/${testHealthEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated vaccination description',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated vaccination description');
    });

    it('should delete a health event', async () => {
      await request(app.getHttpServer())
        .delete(`/api/livestock/${testLivestockId}/health-events/${testHealthEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/health-events/${testHealthEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent livestock', async () => {
      await request(app.getHttpServer())
        .post('/api/livestock/507f1f77bcf86cd799439011/health-events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'vaccination',
          eventDate: '2024-01-15T10:00:00Z',
          description: 'Test',
          vaccineName: 'Test Vaccine',
        })
        .expect(404);
    });
  });

  describe('Pagination', () => {
    it('should paginate health events', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/livestock/${testLivestockId}/health-events`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });
  });
});
