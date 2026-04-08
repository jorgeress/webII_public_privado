import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2).max(100),
    password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  })
});

// ─── Books ───────────────────────────────────────────────────────────────────

export const createBookSchema = z.object({
  body: z.object({
    isbn: z.string().min(1, 'El ISBN es requerido'),
    title: z.string().min(1).max(255),
    author: z.string().min(1).max(255),
    genre: z.string().min(1, 'El género es requerido'),
    description: z.string().optional(),
    publishedYear: z.coerce.number().int().min(1000).max(new Date().getFullYear()),
    copies: z.coerce.number().int().min(1),
  })
});

export const updateBookSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    author: z.string().min(1).max(255).optional(),
    genre: z.string().min(1).optional(),
    description: z.string().optional(),
    publishedYear: z.coerce.number().int().min(1000).max(new Date().getFullYear()).optional(),
    copies: z.coerce.number().int().min(0).optional(),
    available: z.coerce.number().int().min(0).optional(),
  })
});

export const booksQuerySchema = z.object({
  query: z.object({
    genre: z.string().optional(),
    author: z.string().optional(),
    available: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
  })
});

// ─── Loans ───────────────────────────────────────────────────────────────────

export const createLoanSchema = z.object({
  body: z.object({
    bookId: z.coerce.number().int().min(1, 'ID de libro inválido'),
  })
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  })
});

// ─── Params ──────────────────────────────────────────────────────────────────

export const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().min(1, 'ID inválido'),
  })
});