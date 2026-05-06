// tests/helpers.ts

import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';


export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export async function clearDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function disconnectDb(): Promise<void> {
  await mongoose.connection.close();
}

// ── Registers, verifies and logs in a user, returns token + user data ──────
export async function createVerifiedUser(
  email = 'test@example.com',
  password = 'Password123'
): Promise<{ accessToken: string; userId: string }> {
  // Register
  const reg = await request(app)
    .post('/api/user/register')
    .send({ email, password });

  const accessToken: string = reg.body.accessToken;
  const userId: string = reg.body.data?._id ?? '';

  await User.findOneAndUpdate({ email }, { status: 'verified' });

  return { accessToken, userId };
}

// ── Creates a user with company, returns token ──────────────────────────────
export async function createUserWithCompany(
  email = 'admin@example.com',
  password = 'Password123'
): Promise<{ accessToken: string; companyId: string }> {
  const { accessToken: regToken } = await createVerifiedUser(email, password);

  const personalRes = await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${regToken}`)
    .send({ name: 'Admin', lastName: 'Test', nif: 'A12345678' });
  
  console.log('[helper] personalData status:', personalRes.status, personalRes.body);

  const compRes = await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${regToken}`)
    .send({ isFreelance: false, name: 'Test Company SL', cif: `CIF-${Date.now()}` });

  console.log('[helper] company status:', compRes.status, compRes.body);

  const companyId: string = compRes.body.data?.company?._id ?? '';

  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email, password });

  console.log('[helper] login status:', loginRes.status, loginRes.body?.data);

  return { accessToken: loginRes.body.accessToken, companyId };
}
