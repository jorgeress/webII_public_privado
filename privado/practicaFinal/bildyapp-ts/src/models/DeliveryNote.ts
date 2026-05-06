// src/models/DeliveryNote.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IWorker {
  name: string;
  hours: number;
}

export interface IDeliveryNote extends Document {
  user: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  format: 'material' | 'hours';
  description?: string;
  workDate: Date;
  // material
  material?: string;
  quantity?: number;
  unit?: string;
  // hours
  hours?: number;
  workers?: IWorker[];
  // firma
  signed: boolean;
  signedAt?: Date;
  signatureUrl?: string;
  pdfUrl?: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workerSchema = new Schema<IWorker>(
  { name: { type: String, required: true }, hours: { type: Number, required: true } },
  { _id: false }
);

const deliveryNoteSchema = new Schema<IDeliveryNote>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    format: { type: String, enum: ['material', 'hours'], required: true },
    description: { type: String },
    workDate: { type: Date, required: true },
    material: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    hours: { type: Number },
    workers: { type: [workerSchema], default: [] },
    signed: { type: Boolean, default: false, index: true },
    signedAt: { type: Date },
    signatureUrl: { type: String },
    pdfUrl: { type: String },
    deleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const DeliveryNote = mongoose.model<IDeliveryNote>('DeliveryNote', deliveryNoteSchema);
