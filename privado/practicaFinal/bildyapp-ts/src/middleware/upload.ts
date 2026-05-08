// src/middleware/upload.ts

import multer from 'multer';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';
import { Request } from 'express';

const storage = multer.memoryStorage();

// Tipos MIME permitidos explícitamente — SVG excluido porque:
// 1. Puede contener JavaScript embebido (<script>) → XSS stored
// 2. Sharp puede procesar SVG pero el resultado es impredecible
// 3. No es un formato útil para firmas o logos de empresa
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        `Tipo de archivo no permitido: ${file.mimetype}. ` +
        `Solo se aceptan: ${[...ALLOWED_IMAGE_MIMES].join(', ')}`
      )
    );
  }
}

const maxSize = config.upload.maxSizeMb * 1024 * 1024;

export const uploadSignature = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).single('signature');

export const uploadLogo = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: maxSize },
}).single('logo');