// src/services/storage.service.ts

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { config } from '../config/index.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const storageService = {
  /**
   * Sube una imagen de firma a Cloudinary.
   * Primero la optimiza con Sharp (máx 800px, WebP).
   */
  async uploadSignature(fileBuffer: Buffer, filename: string): Promise<string> {
    const optimized = await sharp(fileBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'bildyapp/signatures',
            public_id: filename,
            resource_type: 'image',
            format: 'webp',
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Upload failed'));
            resolve(result.secure_url);
          }
        )
        .end(optimized);
    });
  },

  /**
   * Sube un PDF de albarán a Cloudinary.
   */
  async uploadPdf(pdfBuffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'bildyapp/pdfs',
            public_id: filename,
            resource_type: 'raw',
            format: 'pdf',
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Upload failed'));
            resolve(result.secure_url);
          }
        )
        .end(pdfBuffer);
    });
  },

  /**
   * Sube el logo de empresa a Cloudinary.
   */
  async uploadLogo(fileBuffer: Buffer, filename: string): Promise<string> {
    const optimized = await sharp(fileBuffer)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'bildyapp/logos', public_id: filename, resource_type: 'image' },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Upload failed'));
            resolve(result.secure_url);
          }
        )
        .end(optimized);
    });
  },
};
