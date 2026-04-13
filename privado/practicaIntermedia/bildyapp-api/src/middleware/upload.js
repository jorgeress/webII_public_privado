// src/middleware/upload.js
// Configuración de Multer para subida de imágenes.
// Solo acepta imágenes y limita el tamaño según config.

import multer from 'multer';
import path from 'path';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.dest),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `logo-${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Solo se permiten imágenes'), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSizeMb * 1024 * 1024 },
});