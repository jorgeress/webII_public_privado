// src/middleware/validate.js
// Middleware genérico de validación Zod.
// Uso: router.post('/ruta', validate(miSchema), controller)

import { AppError } from '../utils/AppError.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Formatea los errores de Zod en un mensaje legible
      const message = result.error.issues
        .map((issue) => issue.message)
        .join('. ');
      return next(AppError.badRequest(message));
    }

    // Reemplaza req.body con los datos ya validados y transformados
    req.body = result.data;
    next();
  };
}