// src/utils/AppError.js
// Clase de error personalizada con métodos factoría para los casos más comunes.
// Todos los errores de negocio se crean con estos métodos,
// nunca con `new Error()` directamente.

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distingue errores nuestros de bugs inesperados
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Métodos factoría ──────────────────────────────────────────────────────

  static badRequest(message = 'Solicitud incorrecta') {
    return new AppError(message, 400);
  }

  static unauthorized(message = 'No autenticado') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Acceso denegado') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404);
  }

  static conflict(message = 'Conflicto con un recurso existente') {
    return new AppError(message, 409);
  }

  static tooManyRequests(message = 'Demasiados intentos') {
    return new AppError(message, 429);
  }

  static internal(message = 'Error interno del servidor') {
    return new AppError(message, 500);
  }
}