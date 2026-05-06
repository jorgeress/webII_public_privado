// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';

interface JwtPayload {
  id: string;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    const user = await User.findById(payload.id).select('-password -verificationCode');
    if (!user || user.deleted) {
      return next(AppError.unauthorized('Usuario no encontrado'));
    }

    req.user = user;
    next();
  } catch {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
}
