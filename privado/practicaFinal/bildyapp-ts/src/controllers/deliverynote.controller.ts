// src/controllers/deliverynote.controller.ts

import { Request, Response, NextFunction } from 'express';
import { DeliveryNote } from '../models/DeliveryNote.js';
import { Project } from '../models/Project.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { storageService } from '../services/storage.service.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';
import type { IUser } from '../models/User.js';
import type { IClient } from '../models/Client.js';
import type { IProject } from '../models/Project.js';

// ── POST /api/deliverynote ────────────────────────────────────────────────────
export async function createDeliveryNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user.company;
    if (!companyId) throw AppError.badRequest('Debes pertenecer a una compañía');

    const { project: projectId, client: clientId, format, description, workDate,
            material, quantity, unit, hours, workers } = req.body;

    const [projectDoc, clientDoc] = await Promise.all([
      Project.findOne({ _id: projectId, company: companyId, deleted: false }),
      Client.findOne({ _id: clientId, company: companyId, deleted: false }),
    ]);
    if (!projectDoc) throw AppError.notFound('Proyecto no encontrado en tu compañía');
    if (!clientDoc) throw AppError.notFound('Cliente no encontrado en tu compañía');

    const note = await DeliveryNote.create({
      user: req.user._id,
      company: companyId,
      client: clientId,
      project: projectId,
      format,
      description,
      workDate: new Date(workDate as string),
      material,
      quantity,
      unit,
      hours,
      workers,
    });

    const io = req.app.get('io') as import('socket.io').Server;
    io.to(String(companyId)).emit('deliverynote:new', note);

    res.status(201).json({ status: 'success', data: note });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/deliverynote ─────────────────────────────────────────────────────
export async function listDeliveryNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user.company;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { company: companyId, deleted: false };
    if (req.query.project) filter.project = req.query.project;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.format) filter.format = req.query.format;
    if (req.query.signed !== undefined) filter.signed = req.query.signed === 'true';
    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, Date> = {};
      if (req.query.from) dateFilter.$gte = new Date(String(req.query.from));
      if (req.query.to) dateFilter.$lte = new Date(String(req.query.to));
      filter.workDate = dateFilter;
    }

    const sortField = String(req.query.sort || '-workDate');
    const sortOrder = sortField.startsWith('-') ? -1 : 1;
    const sortKey = sortField.replace(/^-/, '');
    const sort: Record<string, number> = { [sortKey]: sortOrder };

    const [items, total] = await Promise.all([
      DeliveryNote.find(filter)
        .populate('client', 'name cif')
        .populate('project', 'name projectCode')
        .sort(sort).skip(skip).limit(limit),
      DeliveryNote.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: items,
      meta: { totalItems: total, totalPages: Math.ceil(total / limit), currentPage: page },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/deliverynote/:id ─────────────────────────────────────────────────
export async function getDeliveryNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false,
    })
      .populate('user', 'name lastName email')
      .populate('client', 'name cif email address')
      .populate('project', 'name projectCode address');

    if (!note) throw AppError.notFound('Albarán no encontrado');
    res.json({ status: 'success', data: note });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/deliverynote/pdf/:id ─────────────────────────────────────────────
export async function downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false,
    });
    if (!note) throw AppError.notFound('Albarán no encontrado');

    // Si ya está firmado y tiene PDF en la nube, redirigir
    if (note.signed && note.pdfUrl) {
      res.redirect(note.pdfUrl);
      return;
    }

    // Obtener datos relacionados para generar el PDF
    const [user, client, project] = await Promise.all([
      User.findById(note.user),
      Client.findById(note.client),
      Project.findById(note.project),
    ]);
    if (!user || !client || !project) throw AppError.internal('Datos del albarán incompletos');

    const pdfBuffer = await generateDeliveryNotePdf({
      note,
      user: user as IUser,
      client: client as IClient,
      project: project as IProject,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="albaran-${note._id}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    });
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/deliverynote/:id/sign ─────────────────────────────────────────
export async function signDeliveryNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false,
    });
    if (!note) throw AppError.notFound('Albarán no encontrado');
    if (note.signed) throw AppError.conflict('El albarán ya está firmado');
    if (!req.file) throw AppError.badRequest('Se requiere la imagen de firma');

    // Subir firma a Cloudinary
    const signatureUrl = await storageService.uploadSignature(
      req.file.buffer,
      `sig-${note._id}-${Date.now()}`
    );

    // Obtener datos para generar PDF
    const [user, client, project] = await Promise.all([
      User.findById(note.user),
      Client.findById(note.client),
      Project.findById(note.project),
    ]);
    if (!user || !client || !project) throw AppError.internal('Datos del albarán incompletos');

    note.signed = true;
    note.signedAt = new Date();
    note.signatureUrl = signatureUrl;
    await note.save();

    // Generar PDF y subirlo a Cloudinary
    const pdfBuffer = await generateDeliveryNotePdf({
      note,
      user: user as IUser,
      client: client as IClient,
      project: project as IProject,
      signatureImageUrl: signatureUrl,
    });

    const pdfUrl = await storageService.uploadPdf(
      pdfBuffer,
      `albaran-${note._id}-${Date.now()}`
    );
    note.pdfUrl = pdfUrl;
    await note.save();

    const io = req.app.get('io') as import('socket.io').Server;
    io.to(String(req.user.company)).emit('deliverynote:signed', { id: note._id, pdfUrl });

    res.json({ status: 'success', data: note });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/deliverynote/:id ──────────────────────────────────────────────
export async function deleteDeliveryNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
    });
    if (!note) throw AppError.notFound('Albarán no encontrado');
    if (note.signed) throw AppError.conflict('No se puede eliminar un albarán firmado');

    await note.deleteOne();
    res.json({ status: 'success', message: 'Albarán eliminado' });
  } catch (err) {
    next(err);
  }
}
