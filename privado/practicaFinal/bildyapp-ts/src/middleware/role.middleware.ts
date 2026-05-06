// src/middleware/role.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Se requiere uno de estos roles: ${roles.join(', ')}`));
    }
    next();
  };
}
