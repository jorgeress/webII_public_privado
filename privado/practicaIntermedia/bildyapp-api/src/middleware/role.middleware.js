// src/middleware/role.middleware.js
// Middleware de autorización basado en roles (T7).
// Debe usarse DESPUÉS de authenticate.
// Uso: router.post('/ruta', authenticate, requireRole('admin'), controller)

import { AppError } from '../utils/AppError.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Se requiere uno de estos roles: ${roles.join(', ')}`));
    }
    next();
  };
}