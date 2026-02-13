import { z } from 'zod';

export const createTareaSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    priority: z.enum(['low', 'medium', 'high']),
    completed: z.boolean().default(false),
    dueDate: z.string().datetime().refine((date) => new Date(date) > new Date(), {
      message: "La fecha de vencimiento debe ser en el futuro"
    }).optional(),
    tags: z.array(z.string()).max(5, "Máximo 5 tags").default([])
  })
});

export const updateTareaSchema = z.object({
  body: createTareaSchema.shape.body.partial(),
  params: z.object({
    id: z.string().uuid("ID inválido (debe ser UUID)")
  })
});