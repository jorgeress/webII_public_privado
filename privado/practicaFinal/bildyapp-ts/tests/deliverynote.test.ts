// tests/deliverynote.test.ts

import request from 'supertest';
import { app } from '../src/app.js';
import { connectDb, clearDb, disconnectDb, createUserWithCompany } from './helpers.js';
import { DeliveryNote } from '../src/models/DeliveryNote.js';

let token: string;
let clientId: string;
let projectId: string;

beforeAll(async () => { await connectDb(); });
beforeEach(async () => {
  await clearDb();
  const u = await createUserWithCompany(`dn-admin-${Date.now()}@test.com`);
  token = u.accessToken;

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Albarán', cif: `CIF-${Date.now()}` });
  clientId = clientRes.body.data._id as string;

  const projRes = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proyecto Albarán', projectCode: `PRJ-${Date.now()}`, client: clientId });
  projectId = projRes.body.data._id as string;
});
afterAll(async () => { await disconnectDb(); });

const hoursNote = () => ({
  project: projectId,
  client: clientId,
  format: 'hours',
  workDate: '2025-06-01',
  hours: 8,
  description: 'Trabajo de prueba',
});

const materialNote = () => ({
  project: projectId,
  client: clientId,
  format: 'material',
  workDate: '2025-06-01',
  material: 'Cemento Portland',
  quantity: 50,
  unit: 'kg',
});

describe('POST /api/deliverynote', () => {
  it('crea albarán de horas', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(hoursNote());

    expect(res.status).toBe(201);
    expect(res.body.data.format).toBe('hours');
    expect(res.body.data.signed).toBe(false);
  });

  it('crea albarán de materiales', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(materialNote());

    expect(res.status).toBe(201);
    expect(res.body.data.material).toBe('Cemento Portland');
  });

  it('crea albarán con múltiples trabajadores', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...hoursNote(),
        hours: undefined,
        workers: [{ name: 'Juan', hours: 4 }, { name: 'Ana', hours: 6 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.workers).toHaveLength(2);
  });

  it('falla si formato hours sin horas ni trabajadores', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, client: clientId, format: 'hours', workDate: '2025-06-01' });
    expect(res.status).toBe(400);
  });

  it('falla si proyecto no existe', async () => {
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...hoursNote(), project: '000000000000000000000000' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/deliverynote', () => {
  beforeEach(async () => {
    await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(hoursNote());
    await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(materialNote());
  });

  it('lista con paginación', async () => {
    const res = await request(app).get('/api/deliverynote?page=1&limit=10').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.totalItems).toBe(2);
  });

  it('filtra por formato', async () => {
    const res = await request(app).get('/api/deliverynote?format=hours').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((n: { format: string }) => n.format === 'hours')).toBe(true);
  });

  it('filtra por proyecto', async () => {
    const res = await request(app)
      .get(`/api/deliverynote?project=${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filtra por rango de fechas', async () => {
    const res = await request(app)
      .get('/api/deliverynote?from=2025-01-01&to=2025-12-31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/deliverynote/:id', () => {
  it('devuelve albarán con datos populados', async () => {
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(hoursNote());

    const id = created.body.data._id as string;
    const res = await request(app).get(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.client).toBeDefined();
    expect(res.body.data.project).toBeDefined();
  });
});

describe('GET /api/deliverynote/pdf/:id', () => {
  it('genera PDF del albarán', async () => {
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(hoursNote());

    const id = created.body.data._id as string;
    const res = await request(app)
      .get(`/api/deliverynote/pdf/${id}`)
      .set('Authorization', `Bearer ${token}`);

    // Puede ser 200 (PDF buffer) o 302 (redirect si está firmado)
    expect([200, 302]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-type']).toContain('application/pdf');
    }
  });
});

describe('DELETE /api/deliverynote/:id', () => {
  it('elimina albarán no firmado', async () => {
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(hoursNote());

    const id = created.body.data._id as string;
    const res = await request(app).delete(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('no permite eliminar albarán firmado', async () => {
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(hoursNote());

    const id = created.body.data._id as string;

    await DeliveryNote.findByIdAndUpdate(id, { signed: true });

    const res = await request(app).delete(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});
