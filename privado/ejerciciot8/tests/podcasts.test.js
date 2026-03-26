import dotenv from 'dotenv';
dotenv.config();
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';

let userToken;
let adminToken;
let podcastId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  await mongoose.connection.dropDatabase();

  // Crear usuario normal
  const userRes = await request(app).post('/api/auth/register').send({
    name: 'User Test',
    email: 'user@test.com',
    password: 'password123'
  });
  userToken = userRes.body.token;

  // Crear usuario admin
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin Test',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  });
  adminToken = adminRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('GET /api/podcasts', () => {
  it('200 con array de podcasts publicados', async () => {
    const res = await request(app).get('/api/podcasts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/podcasts', () => {
  it('201 con podcast creado', async () => {
    const res = await request(app)
      .post('/api/podcasts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Podcast Test',
        description: 'Descripción del podcast test',
        category: 'tech',
        duration: 3600
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('title', 'Podcast Test');
    podcastId = res.body._id;
  });

  it('401 sin token', async () => {
    const res = await request(app).post('/api/podcasts').send({
      title: 'Podcast Test',
      description: 'Descripción del podcast test',
      category: 'tech',
      duration: 3600
    });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/podcasts/:id', () => {
  it('200 solo para admin', async () => {
    const res = await request(app)
      .delete(`/api/podcasts/${podcastId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('403 para user normal', async () => {
    // Crear otro podcast para esta prueba
    const created = await request(app)
      .post('/api/podcasts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Podcast Test 2',
        description: 'Descripción del podcast test 2',
        category: 'tech',
        duration: 3600
      });

    const res = await request(app)
      .delete(`/api/podcasts/${created.body._id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/podcasts/admin/all', () => {
  it('200 solo para admin', async () => {
    const res = await request(app)
      .get('/api/podcasts/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
