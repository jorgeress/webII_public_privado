import mongoose from 'mongoose';
import { z } from 'zod';

// Zod schema for validation
export const RoomSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre de la sala debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres'),
  description: z.string().max(200, 'La descripción no puede superar 200 caracteres').optional(),
  isPrivate: z.boolean().optional().default(false),
});

// Mongoose schema
const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    description: {
      type: String,
      default: '',
      maxlength: 200,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

roomSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Room = mongoose.model('Room', roomSchema);