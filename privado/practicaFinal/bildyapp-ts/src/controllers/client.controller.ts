// src/controllers/client.controller.ts

import { Request, Response, NextFunction } from 'express';
import { Client } from '../models/Client.js';
import { AppError } from '../utils/AppError.js';

// ── POST /api/client ──────────────────────────────────────────────────────────
export async function createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, cif, email, phone, address } = req.body;
    const companyId = req.user.company;
    if (!companyId) throw AppError.badRequest('Debes pertenecer a una compañía');

    const existing = await Client.findOne({ company: companyId, cif, deleted: false });
    if (existing) throw AppError.conflict('Ya existe un cliente con ese CIF en tu compañía');

    const client = await Client.create({
      user: req.user._id,
      company: companyId,
      name,
      cif,
      email,
      phone,
      address,
    });

    // Socket.IO: emitir a la room de la compañía
    const io = req.app.get('io') as import('socket.io').Server;
    io.to(String(companyId)).emit('client:new', client);

    res.status(201).json({ status: 'success', data: client });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/client/:id ───────────────────────────────────────────────────────
export async function updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user.company;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: companyId, deleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!client) throw AppError.notFound('Cliente no encontrado');
    res.json({ status: 'success', data: client });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/client ───────────────────────────────────────────────────────────
export async function listClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user.company;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { company: companyId, deleted: false };
    if (req.query.name) filter.name = { $regex: String(req.query.name), $options: 'i' };

    const sortField = String(req.query.sort || 'createdAt');
    const sortOrder = sortField.startsWith('-') ? -1 : 1;
    const sortKey = sortField.replace(/^-/, '');
    const sort: Record<string, number> = { [sortKey]: sortOrder };

    const [items, total] = await Promise.all([
      Client.find(filter).sort(sort as any).skip(skip).limit(limit),
      Client.countDocuments(filter),
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

// ── GET /api/client/archived ──────────────────────────────────────────────────
export async function listArchivedClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user.company;
    const clients = await Client.find({ company: companyId, deleted: true });
    res.json({ status: 'success', data: clients });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/client/:id ───────────────────────────────────────────────────────
export async function getClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false,
    });
    if (!client) throw AppError.notFound('Cliente no encontrado');
    res.json({ status: 'success', data: client });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/client/:id ────────────────────────────────────────────────────
export async function deleteClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const soft = req.query.soft === 'true';
    const companyId = req.user.company;
    const client = await Client.findOne({ _id: req.params.id, company: companyId });
    if (!client) throw AppError.notFound('Cliente no encontrado');

    if (soft) {
      client.deleted = true;
      await client.save();
    } else {
      await client.deleteOne();
    }

    res.json({ status: 'success', message: `Cliente eliminado (${soft ? 'soft' : 'hard'})` });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/client/:id/restore ────────────────────────────────────────────
export async function restoreClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: true },
      { deleted: false },
      { new: true }
    );
    if (!client) throw AppError.notFound('Cliente archivado no encontrado');
    res.json({ status: 'success', data: client });
  } catch (err) {
    next(err);
  }
}
