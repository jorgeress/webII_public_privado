import express from 'express';
import prisma from './config/prisma.js';

import authRoutes from './routes/auth.routes.js';
import booksRoutes from './routes/books.routes.js';
import loansRoutes from './routes/loans.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';

import { authenticate } from './middleware/auth.middleware.js';
import { asyncHandler, notFound, errorHandler } from './middleware/error.middleware.js';
import { validate } from './middleware/validate.middleware.js';
import { idParamSchema } from './schemas/validation.js';

import { deleteReview } from './controllers/reviews.controller.js';
import { getStats } from './controllers/stats.controller.js';

const app = express();

app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/books/:id/reviews', reviewsRoutes);

// DELETE reviews — ruta independiente porque no encaja bajo /books/:id/reviews
app.delete('/api/reviews/:id', authenticate, validate(idParamSchema), asyncHandler(deleteReview));

// Stats
app.get('/api/stats', asyncHandler(getStats));

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));