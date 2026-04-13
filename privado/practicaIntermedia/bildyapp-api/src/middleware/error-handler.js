// src/middleware/error-handler.js
// Middleware centralizado de errores (T6).
// Debe registrarse ÚLTIMO en app.js, después de todas las rutas.

import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';

// Convierte errores de Mongoose/JWT a AppError para respuesta uniforme
function normalizeError(err) {
  // Email duplicado (index unique de Mongoose)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return AppError.conflict(`El campo '${field}' ya está en uso`);
  }

  // Validación de Mongoose (ej. campo required faltante)
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join('. ');
    return AppError.badRequest(msg);
  }

  // JWT inválido o expirado
  if (err.name === 'JsonWebTokenError') return AppError.unauthorized('Token inválido');
  if (err.name === 'TokenExpiredError') return AppError.unauthorized('Token expirado');

  return err;
}

export function errorHandler(err, req, res, next) {
  const error = normalizeError(err);

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Error interno del servidor';

  // En desarrollo se muestra el stack para facilitar el debug
  const response = { status: 'error', message };
  if (config.nodeEnv === 'development' && !error.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}