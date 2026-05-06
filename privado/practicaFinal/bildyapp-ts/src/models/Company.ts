// src/models/Company.ts

import mongoose, { Document, Schema } from 'mongoose';
import type { IAddress } from './User.js';

export interface ICompany extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  cif: string;
  address?: IAddress;
  logo?: string | null;
  isFreelance: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  { street: String, number: String, postal: String, city: String, province: String },
  { _id: false }
);

const companySchema = new Schema<ICompany>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    cif: { type: String, required: true, unique: true, trim: true },
    address: addressSchema,
    logo: { type: String, default: null },
    isFreelance: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Company = mongoose.model<ICompany>('Company', companySchema);
