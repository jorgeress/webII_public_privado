// src/utils/AppError.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Solicitud incorrecta'): AppError {
    return new AppError(message, 400);
  }
  static unauthorized(message = 'No autenticado'): AppError {
    return new AppError(message, 401);
  }
  static forbidden(message = 'Acceso denegado'): AppError {
    return new AppError(message, 403);
  }
  static notFound(message = 'Recurso no encontrado'): AppError {
    return new AppError(message, 404);
  }
  static conflict(message = 'Conflicto con un recurso existente'): AppError {
    return new AppError(message, 409);
  }
  static tooManyRequests(message = 'Demasiados intentos'): AppError {
    return new AppError(message, 429);
  }
  static internal(message = 'Error interno del servidor'): AppError {
    return new AppError(message, 500);
  }
}
