// src/controllers/project.controller.ts

import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project.js';
import { Client } from '../models/Client.js';
import { AppError } from '../utils/AppError.js';

// ── POST /api/project ─────────────────────────────────────────────────────────
export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { client: clientId, name, projectCode, address, email, notes, active } = req.body;
    const companyId = req.user.company;
    if (!companyId) throw AppError.badRequest('Debes pertenecer a una compañía');

    // Verificar que el cliente pertenece a la misma compañía
    const clientDoc = await Client.findOne({ _id: clientId, company: companyId, deleted: false });
    if (!clientDoc) throw AppError.notFound('Cliente no encontrado en tu compañía');

    const existing = await Project.findOne({ company: companyId, projectCode });
    if (existing) throw AppError.conflict('Ya existe un proyecto con ese código en tu compañía');

    const project = await Project.create({
      user: req.user._id,
      company: companyId,
      client: clientId,
      name,
      projectCode,
      address,
      email,
      notes,
      active: active ?? true,
    });

    const io = req.app.get('io') as import('socket.io').Server;
    io.to(String(companyId)).emit('project:new', project);

    res.status(201).json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/project/:id ──────────────────────────────────────────────────────
export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: false },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!project) throw AppError.notFound('Proyecto no encontrado');
    res.json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/project ──────────────────────────────────────────────────────────
export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.user.company;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { company: companyId, deleted: false };
    if (req.query.client) filter.client = req.query.client;
    if (req.query.name) filter.name = { $regex: String(req.query.name), $options: 'i' };
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';

    const sortField = String(req.query.sort || 'createdAt');
    const sortOrder = sortField.startsWith('-') ? -1 : 1;
    const sortKey = sortField.replace(/^-/, '');
    const sort: Record<string, number> = { [sortKey]: sortOrder };

    const [items, total] = await Promise.all([
      Project.find(filter).populate('client', 'name cif').sort(sort as any).skip(skip).limit(limit),
      Project.countDocuments(filter),
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

// ── GET /api/project/archived ─────────────────────────────────────────────────
export async function listArchivedProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await Project.find({ company: req.user.company, deleted: true });
    res.json({ status: 'success', data: projects });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/project/:id ──────────────────────────────────────────────────────
export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false,
    }).populate('client', 'name cif email');
    if (!project) throw AppError.notFound('Proyecto no encontrado');
    res.json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/project/:id ───────────────────────────────────────────────────
export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const soft = req.query.soft === 'true';
    const project = await Project.findOne({ _id: req.params.id, company: req.user.company });
    if (!project) throw AppError.notFound('Proyecto no encontrado');

    if (soft) {
      project.deleted = true;
      await project.save();
    } else {
      await project.deleteOne();
    }

    res.json({ status: 'success', message: `Proyecto eliminado (${soft ? 'soft' : 'hard'})` });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/project/:id/restore ───────────────────────────────────────────
export async function restoreProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: true },
      { deleted: false },
      { new: true }
    );
    if (!project) throw AppError.notFound('Proyecto archivado no encontrado');
    res.json({ status: 'success', data: project });
  } catch (err) {
    next(err);
  }
}
