// tests/client.test.ts

import request from 'supertest';
import { app } from '../src/app.js';
import { connectDb, clearDb, disconnectDb, createUserWithCompany } from './helpers.js';

let token: string;

beforeAll(async () => { await connectDb(); });
beforeEach(async () => {
  await clearDb();
  const u = await createUserWithCompany(`client-admin-${Date.now()}@test.com`);
  token = u.accessToken;
});
afterAll(async () => { await disconnectDb(); });

const validClient = {
  name: 'Cliente Test SL',
  cif: 'B12345678',
  email: 'cliente@test.com',
  phone: '600000000',
  address: { street: 'Calle Mayor', number: '1', city: 'Madrid', province: 'Madrid', postal: '28001' },
};

describe('POST /api/client', () => {
  it('crea un cliente correctamente', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(validClient.name);
    expect(res.body.data.cif).toBe(validClient.cif);
  });

  it('falla sin nombre', async () => {
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ cif: 'B12345678' });
    expect(res.status).toBe(400);
  });

  it('falla con CIF duplicado en la misma compañía', async () => {
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(validClient);
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validClient, name: 'Otro Cliente' });
    expect(res.status).toBe(409);
  });

  it('requiere autenticación', async () => {
    const res = await request(app).post('/api/client').send(validClient);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/client', () => {
  beforeEach(async () => {
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(validClient);
  });

  it('lista clientes con paginación', async () => {
    const res = await request(app)
      .get('/api/client?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.totalItems).toBe(1);
    expect(res.body.meta.currentPage).toBe(1);
  });

  it('filtra por nombre parcial', async () => {
    const res = await request(app)
      .get('/api/client?name=Cliente')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('no devuelve clientes de otras compañías', async () => {
    const { accessToken: otherToken } = await createUserWithCompany(`other-${Date.now()}@test.com`);
    const res = await request(app)
      .get('/api/client')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/client/:id', () => {
  it('obtiene un cliente por ID', async () => {
    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    const id = created.body.data._id as string;
    const res = await request(app)
      .get(`/api/client/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('devuelve 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/client/:id', () => {
  it('actualiza un cliente', async () => {
    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    const id = created.body.data._id as string;
    const res = await request(app)
      .put(`/api/client/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nombre Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Nombre Actualizado');
  });
});

describe('DELETE /api/client/:id', () => {
  it('hace soft delete', async () => {
    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    const id = created.body.data._id as string;
    const del = await request(app)
      .delete(`/api/client/${id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    // Ya no aparece en la lista normal
    const list = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`);
    expect(list.body.data).toHaveLength(0);
  });

  it('hace hard delete', async () => {
    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    const id = created.body.data._id as string;
    const del = await request(app)
      .delete(`/api/client/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });
});

describe('GET /api/client/archived + PATCH restore', () => {
  it('lista archivados y restaura', async () => {
    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(validClient);

    const id = created.body.data._id as string;
    await request(app).delete(`/api/client/${id}?soft=true`).set('Authorization', `Bearer ${token}`);

    const archived = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`);
    expect(archived.body.data).toHaveLength(1);

    const restored = await request(app)
      .patch(`/api/client/${id}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(restored.status).toBe(200);
    expect(restored.body.data.deleted).toBe(false);
  });
});
