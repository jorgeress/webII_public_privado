import { z } from 'zod';

export const validatorMovie = z.object({
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  director: z.string().min(1, "El director es requerido"),
  year: z.number().int().min(1888).max(new Date().getFullYear()),
  genre: z.enum(['action', 'comedy', 'drama', 'horror', 'scifi']),
  copies: z.number().int().optional()
});