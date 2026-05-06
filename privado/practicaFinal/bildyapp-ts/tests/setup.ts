import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_ACCESS_SECRET = 'cambia_esto_por_un_secreto_largo_y_aleatorio';
  process.env.JWT_REFRESH_SECRET = 'otro_secreto_diferente_para_refresh';
  process.env.JWT_ACCESS_EXPIRES = '1h';
  process.env.JWT_REFRESH_EXPIRES = '7d';
  process.env.NODE_ENV = 'test';
  // @ts-expect-error
  global.__MONGOD__ = mongod;
}