// src/middleware/error-handler.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';
import { logger } from '../services/logger.service.js';

function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const e = err as Record<string, unknown>;

  if (e.code === 11000) {
    const keyValue = e.keyValue as Record<string, unknown> | undefined;
    const field = keyValue ? Object.keys(keyValue)[0] : 'campo';
    return AppError.conflict(`El campo '${field}' ya está en uso`);
  }

  if (e.name === 'ValidationError') {
    const errors = e.errors as Record<string, { message: string }> | undefined;
    const msg = errors
      ? Object.values(errors).map((v) => v.message).join('. ')
      : 'Error de validación';
    return AppError.badRequest(msg);
  }

  if (e.name === 'JsonWebTokenError') return AppError.unauthorized('Token inválido');
  if (e.name === 'TokenExpiredError') return AppError.unauthorized('Token expirado');
  if (e.name === 'CastError') return AppError.badRequest('ID no válido');

  return new AppError('Error interno del servidor', 500);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR ORIGINAL]', err);  // ← añade esta línea
  const error = normalizeError(err);
  const statusCode = error.statusCode;

  if (statusCode >= 500) {
    logger.error(error, req);
  }

  const body: Record<string, unknown> = { status: 'error', message: error.message };

  if (config.nodeEnv === 'development' && statusCode >= 500) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
}
