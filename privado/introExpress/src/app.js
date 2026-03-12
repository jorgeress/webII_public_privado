// src/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js'; 

const app = express();

// Seguridad
app.use(helmet());
app.use(cors());

// Parseo de body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.json({
    mensaje: 'Servidor funcionando correctamente',
    acceso_api: '/api'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de la API
app.use('/api', routes);

app.use((req, res, next) => {
  const ahora = new Date().toISOString();
  console.log(`[${ahora}] ${req.method} ${req.path}`);
  next();
});
// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);
app.use(requestLogger);

export default app;