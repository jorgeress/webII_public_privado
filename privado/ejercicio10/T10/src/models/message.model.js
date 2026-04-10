import mongoose from 'mongoose';
import { z } from 'zod';

// Zod schema for validation
export const MessageSchema = z.object({
  roomId: z.string().min(1, 'roomId es requerido'),
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'El mensaje no puede superar 2000 caracteres'),
});

export const PrivateMessageSchema = z.object({
  toUserId: z.string().min(1, 'toUserId es requerido'),
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'El mensaje no puede superar 2000 caracteres'),
});

// Mongoose schema
const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For private messages
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'system'],
      default: 'text',
    },
    reactions: [
      {
        emoji: String,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    edited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });

messageSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Message = mongoose.model('Message', messageSchema);