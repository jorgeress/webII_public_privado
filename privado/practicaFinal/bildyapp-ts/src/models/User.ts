// src/models/User.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress {
  street?: string;
  number?: string;
  postal?: string;
  city?: string;
  province?: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  lastName?: string;
  nif?: string;
  role: 'admin' | 'guest';
  status: 'pending' | 'verified';
  verificationCode?: string;
  verificationAttempts: number;
  refreshTokens: string[];
  company?: mongoose.Types.ObjectId;
  address?: IAddress;
  deleted: boolean;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    street: String,
    number: String,
    postal: String,
    city: String,
    province: String,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true },
    lastName: { type: String, trim: true },
    nif: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'guest'], default: 'admin' },
    status: { type: String, enum: ['pending', 'verified'], default: 'pending', index: true },
    verificationCode: { type: String, select: false },
    verificationAttempts: { type: Number, default: 3 },
    refreshTokens: { type: [String], default: [], select: false },
    company: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    address: addressSchema,
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.index({ role: 1 });

userSchema.virtual('fullName').get(function (this: IUser) {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`;
  return this.name ?? '';
});

export const User = mongoose.model<IUser>('User', userSchema);
