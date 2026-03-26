import dotenv from 'dotenv';
dotenv.config();
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';

const testUser = {
  name: 'Jorge Test',
  email: 'jorge@test.com',
  password: 'password123'
};

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
  it('201 con usuario creado', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });

  it('400 si email duplicado', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(400);
  });

  it('400 si faltan campos', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('201 con token cuando credenciales válidas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('401 si contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword'
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('200 con datos del usuario', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', testUser.email);
  });

  it('401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});