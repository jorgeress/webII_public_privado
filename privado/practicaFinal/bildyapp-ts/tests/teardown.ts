// tests/teardown.ts
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalTeardown(): Promise<void> {
  // @ts-expect-error attached in setup
  const mongod = global.__MONGOD__ as MongoMemoryServer | undefined;
  if (mongod) await mongod.stop();
}
