// tests/project.test.ts

import request from 'supertest';
import { app } from '../src/app.js';
import { connectDb, clearDb, disconnectDb, createUserWithCompany } from './helpers.js';

let token: string;
let clientId: string;

beforeAll(async () => { await connectDb(); });
beforeEach(async () => {
  await clearDb();
  const u = await createUserWithCompany(`proj-admin-${Date.now()}@test.com`);
  token = u.accessToken;

  // Crear cliente base para los proyectos
  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Proyecto', cif: `CIF-${Date.now()}` });
  clientId = clientRes.body.data._id as string;
});
afterAll(async () => { await disconnectDb(); });

const makeProject = (code: string) => ({
  name: 'Reforma Oficinas Madrid',
  projectCode: code,
  client: clientId,
  address: { street: 'Gran Vía', number: '1', city: 'Madrid', postal: '28001', province: 'Madrid' },
  email: 'proyecto@test.com',
  notes: 'Notas del proyecto',
});

describe('POST /api/project', () => {
  it('crea un proyecto correctamente', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProject('PRJ-001'));

    expect(res.status).toBe(201);
    expect(res.body.data.projectCode).toBe('PRJ-001');
  });

  it('falla con código duplicado', async () => {
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send(makeProject('PRJ-DUP'));
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send(makeProject('PRJ-DUP'));
    expect(res.status).toBe(409);
  });

  it('falla si el cliente no existe', async () => {
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...makeProject('PRJ-X'), client: '000000000000000000000000' });
    expect(res.status).toBe(404);
  });

  it('requiere autenticación', async () => {
    const res = await request(app).post('/api/project').send(makeProject('PRJ-NOAUTH'));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/project', () => {
  beforeEach(async () => {
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send(makeProject(`PRJ-${Date.now()}`));
  });

  it('lista proyectos con paginación', async () => {
    const res = await request(app).get('/api/project?page=1&limit=5').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.totalItems).toBeGreaterThan(0);
  });

  it('filtra por cliente', async () => {
    const res = await request(app)
      .get(`/api/project?client=${clientId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtra por activo', async () => {
    const res = await request(app)
      .get('/api/project?active=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/project/:id', () => {
  it('obtiene proyecto con cliente populado', async () => {
    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProject('PRJ-GET'));

    const id = created.body.data._id as string;
    const res = await request(app).get(`/api/project/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.client).toBeDefined();
  });
});

describe('PUT /api/project/:id', () => {
  it('actualiza nombre y notas', async () => {
    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProject('PRJ-UPD'));

    const id = created.body.data._id as string;
    const res = await request(app)
      .put(`/api/project/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nuevo Nombre', notes: 'Nuevas notas' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Nuevo Nombre');
  });
});

describe('DELETE + archive + restore /api/project', () => {
  it('soft delete y restaura', async () => {
    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProject('PRJ-DEL'));

    const id = created.body.data._id as string;

    await request(app).delete(`/api/project/${id}?soft=true`).set('Authorization', `Bearer ${token}`);

    const archived = await request(app).get('/api/project/archived').set('Authorization', `Bearer ${token}`);
    expect(archived.body.data.length).toBeGreaterThan(0);

    const restored = await request(app).patch(`/api/project/${id}/restore`).set('Authorization', `Bearer ${token}`);
    expect(restored.status).toBe(200);
    expect(restored.body.data.deleted).toBe(false);
  });

  it('hard delete', async () => {
    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(makeProject('PRJ-HARD'));

    const id = created.body.data._id as string;
    const res = await request(app).delete(`/api/project/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
