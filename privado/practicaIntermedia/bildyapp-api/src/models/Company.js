// src/models/Company.js

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

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    cif: { type: String, required: true, unique: true, trim: true },
    address: addressSchema,
    logo: { type: String, default: null },   
    isFreelance: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,  
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Company = mongoose.model('Company', companySchema);