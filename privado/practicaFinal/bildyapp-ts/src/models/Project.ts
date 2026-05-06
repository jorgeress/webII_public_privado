// src/models/Project.ts

import mongoose, { Document, Schema } from 'mongoose';
import type { IAddress } from './User.js';

export interface IProject extends Document {
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  name: string;
  projectCode: string;
  address?: IAddress;
  email?: string;
  notes?: string;
  active: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  { street: String, number: String, postal: String, city: String, province: String },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    projectCode: { type: String, required: true, trim: true },
    address: addressSchema,
    email: { type: String, trim: true, lowercase: true },
    notes: { type: String },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Código único por compañía
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', projectSchema);
