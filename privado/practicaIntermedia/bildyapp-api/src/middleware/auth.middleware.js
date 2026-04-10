// src/middleware/auth.middleware.js
// Verifica el JWT de la cabecera Authorization: Bearer <token>
// y adjunta el usuario a req.user.

import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'));
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.accessSecret);

    const user = await User.findById(payload.id).select('-password -verificationCode');
    if (!user || user.deleted) {
      return next(AppError.unauthorized('Usuario no encontrado'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err); // JsonWebTokenError y TokenExpiredError los normaliza error-handler
  }
}