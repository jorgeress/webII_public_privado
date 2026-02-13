import { z } from 'zod';

export const createUsuarioSchema = z.object({
  body: z.object({
    nombre: z.string().min(3, 'El nombre es muy corto'),
    email: z.string().email('Email inválido'),
    role: z.enum(['admin', 'user']).default('user')
  })
});

export const updateUsuarioSchema = z.object({
  body: z.object({
    nombre: z.string().min(3).optional(),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'user']).optional()
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numérico')
  })
});