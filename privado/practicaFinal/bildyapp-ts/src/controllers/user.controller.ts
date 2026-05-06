// src/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';
import { mailService } from '../services/mail.service.js';
import { storageService } from '../services/storage.service.js';

function generateTokens(userId: string) {
  const accessToken = jwt.sign(
  { id: userId }, 
  config.jwt.accessSecret as string, 
  { expiresIn: config.jwt.accessExpires as any } // Cambiado de accessExpiresIn a accessExpires
);

const refreshToken = jwt.sign(
  { id: userId }, 
  config.jwt.refreshSecret as string, 
  { expiresIn: config.jwt.refreshExpires as any } // Cambiado de refreshExpiresIn a refreshExpires
);
  return { accessToken, refreshToken };
}

function generateVerificationCode(): string {
  return String(crypto.randomInt(0, 999999)).padStart(6, '0');
}

// ── 1. Registro ───────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const existing = await User.findOne({ email, status: 'verified', deleted: false });
    if (existing) throw AppError.conflict('El email ya está registrado y verificado');

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();

    const user = await User.create({ email, password: hashedPassword, verificationCode, verificationAttempts: 3 });
    const { accessToken, refreshToken } = generateTokens(String(user._id));
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    // Enviar código por email
    if (config.nodeEnv !== 'test') {
      try {
        await mailService.sendVerificationCode(email, verificationCode);
      } catch {
        console.error('[mail] No se pudo enviar el email de verificación');
      }
    }

    res.status(201).json({
      status: 'success',
      data: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── 2. Verificación ───────────────────────────────────────────────────────────
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.body as { code: string };
    const user = await User.findById(req.user._id).select('+verificationCode +verificationAttempts +refreshTokens');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    if (user.status === 'verified') {
      res.json({ status: 'success', message: 'Email ya verificado' });
      return;
    }

    if (user.verificationAttempts <= 0) throw AppError.tooManyRequests('Has agotado los intentos');

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();
      if (user.verificationAttempts === 0) throw AppError.tooManyRequests('Intentos agotados');
      throw AppError.badRequest(`Código incorrecto. Intentos restantes: ${user.verificationAttempts}`);
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    await user.save();

    res.json({ status: 'success', message: 'Email verificado correctamente' });
  } catch (err) {
    next(err);
  }
}

// ── 3. Login ──────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email, deleted: false }).select('+password +refreshTokens');
    if (!user) throw AppError.unauthorized('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw AppError.unauthorized('Credenciales incorrectas');

    if (user.status !== 'verified') {
      throw AppError.unauthorized('Debes verificar tu email antes de iniciar sesión');
    }

    const { accessToken, refreshToken } = generateTokens(String(user._id));
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      status: 'success',
      data: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

// ── 4a. Datos personales ──────────────────────────────────────────────────────
export async function updatePersonalData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, lastName, nif, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif, ...(address && { address }) },
      { new: true, runValidators: true }
    ).select('-password -verificationCode -refreshTokens');
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

// ── 4b. Compañía ──────────────────────────────────────────────────────────────
export async function upsertCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw AppError.notFound('Usuario no encontrado');

    let { isFreelance, name, cif, address } = req.body;

    if (isFreelance) {
      if (!user.nif) throw AppError.badRequest('Completa tus datos personales (NIF) primero');
      cif = user.nif;
      name = user.name ?? 'Autónomo';
      address = user.address;
    }

    let company = await Company.findOne({ cif, deleted: false });
    if (!company) {
      company = await Company.create({ owner: user._id, name, cif, address, isFreelance });
      user.role = 'admin';
    } else {
      user.role = 'guest';
    }

    user.company = company._id as unknown as typeof user.company;
    await user.save();

    res.json({ status: 'success', data: { company, role: user.role } });
  } catch (err) {
    next(err);
  }
}

// ── 5. Logo ───────────────────────────────────────────────────────────────────
export async function uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user.company) throw AppError.badRequest('El usuario no tiene compañía asignada');
    if (!req.file) throw AppError.badRequest('No se recibió ninguna imagen');

    const logoUrl = await storageService.uploadLogo(
      req.file.buffer,
      `logo-${req.user.company}-${Date.now()}`
    );

    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { logo: logoUrl },
      { new: true }
    );

    res.json({ status: 'success', data: { logo: company?.logo } });
  } catch (err) {
    next(err);
  }
}

// ── 6. Obtener usuario ────────────────────────────────────────────────────────
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.user._id)
      .populate('company')
      .select('-password -verificationCode -refreshTokens');
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

// ── 7a. Refresh token ─────────────────────────────────────────────────────────
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    let payload: { id: string };
    try {
      payload = jwt.verify(token, config.jwt.refreshSecret) as { id: string };
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const user = await User.findById(payload.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token)) {
      throw AppError.unauthorized('Refresh token no reconocido');
    }

    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    const { accessToken, refreshToken: newRefresh } = generateTokens(String(user._id));
    user.refreshTokens.push(newRefresh);
    await user.save();

    res.json({ status: 'success', accessToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
}

// ── 7b. Logout ────────────────────────────────────────────────────────────────
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = (req.body as { refreshToken?: string })?.refreshToken;
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    user.refreshTokens = token ? user.refreshTokens.filter((t) => t !== token) : [];
    await user.save();
    res.json({ status: 'success', message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
}

// ── 8. Eliminar ───────────────────────────────────────────────────────────────
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const soft = req.query.soft === 'true';
    if (soft) {
      await User.findByIdAndUpdate(req.user._id, { deleted: true });
    } else {
      await User.findByIdAndDelete(req.user._id);
    }
    res.json({ status: 'success', message: `Usuario eliminado (${soft ? 'soft' : 'hard'})` });
  } catch (err) {
    next(err);
  }
}

// ── 9. Cambiar contraseña ─────────────────────────────────────────────────────
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    const user = await User.findById(req.user._id).select('+password +refreshTokens');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw AppError.unauthorized('La contraseña actual no es correcta');

    user.password = await bcrypt.hash(newPassword, 12);
    user.refreshTokens = [];
    await user.save();

    res.json({ status: 'success', message: 'Contraseña actualizada. Vuelve a iniciar sesión' });
  } catch (err) {
    next(err);
  }
}

// ── 10. Invitar compañero ─────────────────────────────────────────────────────
export async function inviteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, name, lastName } = req.body as { email: string; name: string; lastName?: string };
    if (!req.user.company) throw AppError.badRequest('Debes tener una compañía para invitar');

    const verificationCode = generateVerificationCode();
    const tempPassword = await bcrypt.hash(crypto.randomUUID(), 12);

    const invited = await User.create({
      email, name, lastName,
      password: tempPassword,
      role: 'guest',
      company: req.user.company,
      verificationCode,
      verificationAttempts: 3,
    });

    if (config.nodeEnv !== 'test') {
      try {
        await mailService.sendInvitation(email, verificationCode, req.user.name ?? 'Tu equipo');
      } catch {
        console.error('[mail] No se pudo enviar la invitación');
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Usuario invitado correctamente',
      data: { email: invited.email, role: invited.role },
    });
  } catch (err) {
    next(err);
  }
}
