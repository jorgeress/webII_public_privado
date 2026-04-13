// app.js
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
//import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { AppError } from './utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();



// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas peticiones, intenta más tarde' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de autenticación' },
});

app.use(globalLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Sanitización NoSQL injection ─────────────────────────────────────────────
//app.use(mongoSanitize({ replaceWith: '_' }));

// ─── Archivos estáticos (logos) ───────────────────────────────────────────────
app.use(`/${config.upload.dest}`, express.static(path.join(process.cwd(), config.upload.dest)));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);
app.use('/api/user', userRoutes);

// ─── Ruta no encontrada ───────────────────────────────────────────────────────
app.all('/{*path}', (req, _res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

// ─── Manejador centralizado de errores ────────────────────────────────────────
app.use(errorHandler);

export default app;