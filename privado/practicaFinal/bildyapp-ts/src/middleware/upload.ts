// src/middleware/upload.ts

import multer from 'multer';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';
import { Request } from 'express';

const storage = multer.memoryStorage();

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Solo se permiten imágenes'));
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
