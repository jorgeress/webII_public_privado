import { z } from 'zod';

export const podcastSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Mínimo 3 caracteres').trim(),
    description: z.string().min(10, 'Mínimo 10 caracteres').trim(),
    category: z.enum(['tech', 'science', 'history', 'comedy', 'news']),
    duration: z.number().min(60, 'Mínimo 60 segundos'),
    episodes: z.number().optional().default(1),
    published: z.boolean().optional().default(false)
  })
});