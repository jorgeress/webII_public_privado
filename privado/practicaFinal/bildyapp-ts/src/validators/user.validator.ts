// src/validators/user.validator.ts

import { z } from 'zod';

const emailField = z
  .string({ required_error: 'El email es obligatorio' })
  .email('Email no válido')
  .transform((v) => v.toLowerCase().trim());

const passwordField = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres');

const stringTrimmed = z.string().trim();

const addressSchema = z.object({
  street: stringTrimmed.optional(),
  number: stringTrimmed.optional(),
  postal: stringTrimmed.optional(),
  city: stringTrimmed.optional(),
  province: stringTrimmed.optional(),
});

export const registerSchema = z.object({ email: emailField, password: passwordField });

export const validationCodeSchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d{6}$/),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'La contraseña es obligatoria' }),
});

export const personalDataSchema = z.object({
  name: stringTrimmed.min(1, 'El nombre es obligatorio'),
  lastName: stringTrimmed.min(1, 'Los apellidos son obligatorios'),
  nif: stringTrimmed.min(1, 'El NIF es obligatorio'),
  address: addressSchema.optional(),
});

const companyBase = z.object({ isFreelance: z.literal(false) }).extend({
  name: stringTrimmed.min(1, 'El nombre de la empresa es obligatorio'),
  cif: stringTrimmed.min(1, 'El CIF es obligatorio'),
  address: addressSchema.optional(),
});

const freelanceBase = z.object({ isFreelance: z.literal(true) });

export const companySchema = z.discriminatedUnion('isFreelance', [companyBase, freelanceBase]);

export const refreshSchema = z.object({
  refreshToken: z.string({ required_error: 'El refreshToken es obligatorio' }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'La contraseña actual es obligatoria' }),
    newPassword: passwordField,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export const inviteSchema = z.object({
  email: emailField,
  name: stringTrimmed.min(1, 'El nombre es obligatorio'),
  lastName: stringTrimmed.optional(),
});
