// src/validators/deliverynote.validator.ts

import { z } from 'zod';

const workerSchema = z.object({
  name: z.string().trim().min(1),
  hours: z.number().positive(),
});

export const createDeliveryNoteSchema = z
  .object({
    project: z.string().min(1, 'El proyecto es obligatorio'),
    client: z.string().min(1, 'El cliente es obligatorio'),
    format: z.enum(['material', 'hours']),
    description: z.string().optional(),
    workDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Fecha inválida'),
    // material
    material: z.string().trim().optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().trim().optional(),
    // hours
    hours: z.number().positive().optional(),
    workers: z.array(workerSchema).optional(),
  })
  .refine(
    (d) => {
      if (d.format === 'material') return !!d.material;
      if (d.format === 'hours') return d.hours !== undefined || (d.workers && d.workers.length > 0);
      return true;
    },
    { message: 'Faltan campos según el formato del albarán (material/hours)' }
  );
