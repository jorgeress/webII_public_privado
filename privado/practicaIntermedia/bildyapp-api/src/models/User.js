// src/models/User.js

import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    street: String,
    number: String,
    postal: String,
    city: String,
    province: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,   // index unique (T5)
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    name: { type: String, trim: true },
    lastName: { type: String, trim: true },
    nif: { type: String, trim: true },

    role: {
      type: String,
      enum: ['admin', 'guest'],
      default: 'admin',
    },

    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
      index: true,   // index (T5)
    },

    // Verificación de email
    verificationCode: { type: String },
    verificationAttempts: { type: Number, default: 3 },

    // Refresh tokens activos (permite invalidar en logout)
    refreshTokens: { type: [String], default: [] },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,   // index (T5)
    },

    address: addressSchema,
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },   // necesario para que fullName aparezca en res.json()
    toObject: { virtuals: true },
  }
);

// ── Indexes adicionales (T5) ────────────────────────────────────────────────
userSchema.index({ role: 1 });

// ── Virtual: fullName (T5) ──────────────────────────────────────────────────
// No se almacena en la BD; se calcula cada vez que se serializa el documento.
userSchema.virtual('fullName').get(function () {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`;
  return this.name || '';
});

export const User = mongoose.model('User', userSchema);