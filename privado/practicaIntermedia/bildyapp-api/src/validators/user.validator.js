// src/validators/user.validator.js
// Todos los esquemas Zod para el módulo de usuario 
// Se usa .transform() para normalizar y .refine() para validaciones cruzadas.

import { z } from 'zod';

// ── Reutilizables ─────────────────────────────────────────────────────────────

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

// ── 1. Registro ───────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
});

// ── 2. Validación de email ────────────────────────────────────────────────────

export const validationCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo dígitos'),
});

// ── 3. Login ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'La contraseña es obligatoria' }),
});

// ── 4a. Onboarding: datos personales ─────────────────────────────────────────

export const personalDataSchema = z.object({
  name: stringTrimmed.min(1, 'El nombre es obligatorio'),
  lastName: stringTrimmed.min(1, 'Los apellidos son obligatorios'),
  nif: stringTrimmed.min(1, 'El NIF es obligatorio'),
  address: addressSchema.optional(),
});

// ── 4b. Onboarding: compañía — discriminatedUnion según isFreelance
// Si isFreelance: true → los datos de compañía son opcionales (se toman del usuario)
// Si isFreelance: false → nombre, CIF y dirección son obligatorios

const companyBase = z.object({ isFreelance: z.literal(false) }).extend({
  name: stringTrimmed.min(1, 'El nombre de la empresa es obligatorio'),
  cif: stringTrimmed.min(1, 'El CIF es obligatorio'),
  address: addressSchema.optional(),
});

const freelanceBase = z.object({ isFreelance: z.literal(true) });

export const companySchema = z.discriminatedUnion('isFreelance', [
  companyBase,
  freelanceBase,
]);

// ── 7. Refresh token ──────────────────────────────────────────────────────────

export const refreshSchema = z.object({
  refreshToken: z.string({ required_error: 'El refreshToken es obligatorio' }),
});

// ── 9. Cambiar contraseña — .refine() para validar nueva ≠ actual ────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'La contraseña actual es obligatoria' }),
    newPassword: passwordField,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

// ── 10. Invitar compañero ─────────────────────────────────────────────────────

export const inviteSchema = z.object({
  email: emailField,
  name: stringTrimmed.min(1, 'El nombre es obligatorio'),
  lastName: stringTrimmed.optional(),
});