// tests/deliverynote.test.ts

import request from 'supertest';
import { app } from '../src/app.js';
import { connectDb, clearDb, disconnectDb, createUserWithCompany } from './helpers.js';
import { DeliveryNote } from '../src/models/DeliveryNote.js';
import { User } from '../src/models/User.js';
import { Company } from '../src/models/Company.js';

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

// ── Seguridad: autorización en firma ─────────────────────────────────────────
describe('PATCH /api/deliverynote/:id/sign — autorización', () => {
  it('guest no puede firmar albarán creado por otro usuario', async () => {
    // 1. El admin crea un albarán
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(hoursNote());
    const noteId = created.body.data._id as string;

    // 2. Crear un usuario guest en la MISMA compañía
    //    Obtenemos el usuario actual para saber su compañía
    const meRes = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);
    const companyId: string = meRes.body.data.company._id ?? meRes.body.data.company;

    // Creamos el guest directamente en BD para simplificar el setup
    const guestEmail = `guest-${Date.now()}@test.com`;
    const bcrypt = await import('bcryptjs');
    const hashedPwd = await bcrypt.default.hash('Password123', 10);
    await User.create({
      email: guestEmail,
      password: hashedPwd,
      role: 'guest',
      status: 'verified',
      company: companyId,
    });

    // 3. Login del guest
    const guestLogin = await request(app)
      .post('/api/user/login')
      .send({ email: guestEmail, password: 'Password123' });
    const guestToken: string = guestLogin.body.accessToken;

    // 4. El guest intenta firmar el albarán del admin → debe recibir 403
    const fakeSignature = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const signRes = await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${guestToken}`)
      .attach('signature', fakeSignature, { filename: 'firma.png', contentType: 'image/png' });

    expect(signRes.status).toBe(403);
    expect(signRes.body.message).toMatch(/administrador|creador/i);
  });

  it('el propietario guest SÍ puede firmar su propio albarán', async () => {
    // 1. Crear guest en la misma compañía
    const meRes = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);
    const companyId: string = meRes.body.data.company._id ?? meRes.body.data.company;

    const guestEmail = `guest-owner-${Date.now()}@test.com`;
    const bcrypt = await import('bcryptjs');
    const hashedPwd = await bcrypt.default.hash('Password123', 10);
    await User.create({
      email: guestEmail,
      password: hashedPwd,
      role: 'guest',
      status: 'verified',
      company: companyId,
    });

    const guestLogin = await request(app)
      .post('/api/user/login')
      .send({ email: guestEmail, password: 'Password123' });
    const guestToken: string = guestLogin.body.accessToken;

    // 2. El guest crea su propio albarán
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${guestToken}`)
      .send(hoursNote());
    const noteId = created.body.data._id as string;

    // 3. El guest firma su propio albarán → debe poder (si Cloudinary no está configurado,
    //    fallará en el upload, pero la verificación de autorización pasa)
    const fakeSignature = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const signRes = await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${guestToken}`)
      .attach('signature', fakeSignature, { filename: 'firma.png', contentType: 'image/png' });

    // No debe ser 403 (autorización OK). Puede ser 200 (Cloudinary OK) o 500 (sin Cloudinary en tests)
    expect(signRes.status).not.toBe(403);
  });

  it('admin puede firmar cualquier albarán de su compañía', async () => {
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(hoursNote());
    const noteId = created.body.data._id as string;

    const fakeSignature = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const signRes = await request(app)
      .patch(`/api/deliverynote/${noteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', fakeSignature, { filename: 'firma.png', contentType: 'image/png' });

    // No debe ser 403 — puede ser 200 o 500 (Cloudinary no configurado en tests)
    expect(signRes.status).not.toBe(403);
  });
});