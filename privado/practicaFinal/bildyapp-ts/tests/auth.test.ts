// tests/auth.test.ts

import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDb, clearDb, disconnectDb } from './helpers.js';
import { User } from '../src/models/User.js';


beforeAll(async () => { await connectDb(); });
afterEach(async () => { await clearDb(); });
afterAll(async () => { await disconnectDb(); });

describe('POST /api/user/register', () => {
  it('registra un usuario y devuelve token', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'user@test.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.data.status).toBe('pending');
  });

  it('falla con email inválido', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'noesemail', password: 'Password123' });
    expect(res.status).toBe(400);
  });

  it('falla con contraseña corta', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'user@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('no registra el mismo email verificado dos veces', async () => {
    await request(app).post('/api/user/register').send({ email: 'dup@test.com', password: 'Password123' });
    await User.findOneAndUpdate({ email: 'dup@test.com' }, { status: 'verified' });

    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'dup@test.com', password: 'Password123' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/user/validation', () => {
  it('verifica el email con código correcto', async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'verify@test.com', password: 'Password123' });

   
    const user = await User.findOne({ email: 'verify@test.com' }).select('+verificationCode');
    const code = user?.verificationCode ?? '';

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ code });

    expect(res.status).toBe(200);
  });

  it('falla con código incorrecto', async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'wrongcode@test.com', password: 'Password123' });

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ code: '000000' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/user/login', () => {
  it('hace login de usuario verificado', async () => {
    await request(app).post('/api/user/register').send({ email: 'login@test.com', password: 'Password123' });
    await User.findOneAndUpdate({ email: 'login@test.com' }, { status: 'verified' });

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'login@test.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rechaza login de usuario no verificado', async () => {
    await request(app).post('/api/user/register').send({ email: 'pending@test.com', password: 'Password123' });

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'pending@test.com', password: 'Password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/verificar/i);
  });

  it('rechaza credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'noexiste@test.com', password: 'Password123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/user', () => {
  it('devuelve el usuario autenticado', async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'getme@test.com', password: 'Password123' });

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('getme@test.com');
    expect(res.body.data.password).toBeUndefined();
  });

  it('rechaza sin token', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/user', () => {
  it('soft delete del usuario', async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'del@test.com', password: 'Password123' });

    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /health', () => {
  it('devuelve estado ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.uptime).toBeGreaterThan(0);
  });
});
