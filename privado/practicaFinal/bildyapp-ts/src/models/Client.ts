// src/models/Client.ts

import mongoose, { Document, Schema } from 'mongoose';
import type { IAddress } from './User.js';

export interface IClient extends Document {
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  name: string;
  cif: string;
  email?: string;
  phone?: string;
  address?: IAddress;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  { street: String, number: String, postal: String, city: String, province: String },
  { _id: false }
);

const clientSchema = new Schema<IClient>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    cif: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: addressSchema,
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// CIF único por compañía
clientSchema.index({ company: 1, cif: 1 }, { unique: true });

export const Client = mongoose.model<IClient>('Client', clientSchema);
