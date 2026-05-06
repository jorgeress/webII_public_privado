// src/index.ts

import mongoose from 'mongoose';
import { httpServer, io } from './app.js';
import { config } from './config/index.js';
import { logger } from './services/logger.service.js';

const start = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Conectado a MongoDB');

    const server = httpServer.listen(config.port, () => {
      logger.info(`BildyApp API corriendo en http://localhost:${config.port}`);
      logger.info(`Swagger UI en http://localhost:${config.port}/api-docs`);
    });

    // ── Graceful shutdown ───────────────────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} recibido. Cerrando servidor...`);
      server.close(async () => {
        io.close(() => logger.info('Socket.IO cerrado'));
        await mongoose.connection.close();
        logger.info('MongoDB desconectado. Proceso terminado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error(err instanceof Error ? err : new Error(String(err)));
      server.close(() => process.exit(1));
    });

  } catch (err) {
    logger.error(err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
};

void start();
