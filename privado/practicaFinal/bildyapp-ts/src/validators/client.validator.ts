// src/validators/client.validator.ts

import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
});

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  cif: z.string().trim().min(1, 'El CIF es obligatorio'),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  address: addressSchema.optional(),
});

export const updateClientSchema = createClientSchema.partial();
