// index.js
import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/index.js';

const start = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Conectado a MongoDB Atlas');

    const server = app.listen(config.port, () => {
      console.log(` BildyApp API corriendo en http://localhost:${config.port}`);
    });

    // ─── Cierre limpio ante errores inesperados ───────────────────────────────
    process.on('unhandledRejection', (err) => {
      console.error('❌ unhandledRejection:', err);
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM recibido. Cerrando servidor...');
      server.close(() => process.exit(0));
    });

  } catch (err) {
    console.error('❌ Error al iniciar la aplicación:', err);
    process.exit(1);
  }
};

start();