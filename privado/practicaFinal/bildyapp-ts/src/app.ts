// src/app.ts

import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middleware/error-handler.js';
import { AppError } from './utils/AppError.js';

import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js';

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Authentication required'));
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as { id: string; company?: string };
    socket.data.userId = payload.id;
    socket.data.companyId = payload.company;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const companyId = socket.data.companyId as string | undefined;
  if (companyId) {
    void socket.join(companyId);
    console.log(`[socket] user ${String(socket.data.userId)} joined room ${companyId}`);
  }
  socket.on('disconnect', () => {
    console.log(`[socket] user ${String(socket.data.userId)} disconnected`);
  });
});

// Hacer io accesible desde los controladores via req.app.get('io')
app.set('io', io);

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const isTest = process.env.NODE_ENV === 'test';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 100,  // sin límite efectivo en tests
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas peticiones, intenta más tarde' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 20,   // sin límite efectivo en tests
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de autenticación' },
});
app.use(globalLimiter);
app.use(express.json({ limit: '10kb' }));

// Sanitización manual compatible con Express 5
app.use((req, _res, next) => {
  const sanitize = (obj: Record<string, unknown>) => {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key] as Record<string, unknown>);
      }
    }
  };
  if (req.body) sanitize(req.body as Record<string, unknown>);
  next();
});

app.use(express.urlencoded({ extended: true }));

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'BildyApp API Docs',
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    db: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);

app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.all('/{*path}', (req, _res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export { app, httpServer, io };
