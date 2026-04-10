// src/controllers/user.controller.js
// Controlador con toda la lógica de negocio del módulo de usuario.
// Cada función corresponde a un endpoint de la rúbrica.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';
import { notificationService } from '../services/notification.service.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });
  return { accessToken, refreshToken };
}

function generateVerificationCode() {
  // Código aleatorio de 6 dígitos (cero a la izquierda incluido)
  return String(crypto.randomInt(0, 999999)).padStart(6, '0');
}

// ── 1. Registro — POST /api/user/register ────────────────────────────────────

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    // Comprobar email duplicado (solo entre usuarios verificados)
    const existing = await User.findOne({ email, status: 'verified', deleted: false });
    if (existing) throw AppError.conflict('El email ya está registrado y verificado');

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();

    const user = await User.create({
      email,
      password: hashedPassword,
      verificationCode,
      verificationAttempts: 3,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    notificationService.emit('user:registered', user);

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

// ── 2. Validación del email — PUT /api/user/validation ───────────────────────

export async function verifyEmail(req, res, next) {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (user.status === 'verified') {
      return res.json({ status: 'success', message: 'Email ya verificado' });
    }

    if (user.verificationAttempts <= 0) {
      throw AppError.tooManyRequests('Has agotado los intentos de verificación');
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();

      if (user.verificationAttempts === 0) {
        throw AppError.tooManyRequests('Intentos agotados. Solicita un nuevo código');
      }

      throw AppError.badRequest(
        `Código incorrecto. Intentos restantes: ${user.verificationAttempts}`
      );
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    await user.save();

    notificationService.emit('user:verified', user);

    res.json({ status: 'success', message: 'Email verificado correctamente' });
  } catch (err) {
    next(err);
  }
}

// ── 3. Login — POST /api/user/login ──────────────────────────────────────────

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, deleted: false });
    if (!user) throw AppError.unauthorized('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw AppError.unauthorized('Credenciales incorrectas');

    const { accessToken, refreshToken } = generateTokens(user._id);
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

// ── 4a. Onboarding datos personales — PUT /api/user/register ─────────────────

export async function updatePersonalData(req, res, next) {
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

// ── 4b. Onboarding compañía — PATCH /api/user/company ────────────────────────

export async function upsertCompany(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    let { isFreelance, name, cif, address } = req.body;

    // Si es autónomo, los datos de la empresa son los suyos propios
    if (isFreelance) {
      if (!user.nif) throw AppError.badRequest('Completa tus datos personales (NIF) antes del onboarding de autónomo');
      cif = user.nif;
      name = user.name || 'Autónomo';
      address = user.address;
    }

    let company = await Company.findOne({ cif, deleted: false });

    if (!company) {
      // CIF nuevo → crear compañía y el usuario es el owner (admin)
      company = await Company.create({ owner: user._id, name, cif, address, isFreelance });
      user.role = 'admin';
    } else {
      // CIF existente → unirse como guest
      user.role = 'guest';
    }

    user.company = company._id;
    await user.save();

    res.json({ status: 'success', data: { company, role: user.role } });
  } catch (err) {
    next(err);
  }
}

// ── 5. Logo de la compañía — PATCH /api/user/logo ────────────────────────────

export async function uploadLogo(req, res, next) {
  try {
    if (!req.user.company) throw AppError.badRequest('El usuario no tiene compañía asignada');
    if (!req.file) throw AppError.badRequest('No se recibió ninguna imagen');

    const logoUrl = `/${config.upload.dest}${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { logo: logoUrl },
      { new: true }
    );

    res.json({ status: 'success', data: { logo: company.logo } });
  } catch (err) {
    next(err);
  }
}

// ── 6. Obtener usuario — GET /api/user ───────────────────────────────────────

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .populate('company')           // populate (T5)
      .select('-password -verificationCode -refreshTokens');

    res.json({ status: 'success', data: user }); // fullName sale por toJSON: { virtuals: true }
  } catch (err) {
    next(err);
  }
}

// ── 7a. Refresh token — POST /api/user/refresh ───────────────────────────────

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const user = await User.findById(payload.id);
    if (!user || !user.refreshTokens.includes(token)) {
      throw AppError.unauthorized('Refresh token no reconocido');
    }

    // Rotación de refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    const { accessToken, refreshToken: newRefresh } = generateTokens(user._id);
    user.refreshTokens.push(newRefresh);
    await user.save();

    res.json({ status: 'success', accessToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
}

// ── 7b. Logout — POST /api/user/logout ───────────────────────────────────────

export async function logout(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    const user = await User.findById(req.user._id);

    // Invalida el refresh token específico (o todos si no se envía ninguno)
    if (token) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    } else {
      user.refreshTokens = [];
    }

    await user.save();
    res.json({ status: 'success', message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
}

// ── 8. Eliminar usuario — DELETE /api/user ───────────────────────────────────

export async function deleteUser(req, res, next) {
  try {
    const soft = req.query.soft === 'true';

    if (soft) {
      // Soft delete: marca el campo deleted (T6)
      await User.findByIdAndUpdate(req.user._id, { deleted: true });
    } else {
      // Hard delete: elimina el documento de la BD
      await User.findByIdAndDelete(req.user._id);
    }

    notificationService.emit('user:deleted', req.user);

    res.json({ status: 'success', message: `Usuario eliminado (${soft ? 'soft' : 'hard'})` });
  } catch (err) {
    next(err);
  }
}

// ── 9. Cambiar contraseña — PUT /api/user/password (BONUS) ───────────────────

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw AppError.unauthorized('La contraseña actual no es correcta');

    user.password = await bcrypt.hash(newPassword, 12);
    user.refreshTokens = []; // cierra todas las sesiones activas por seguridad
    await user.save();

    res.json({ status: 'success', message: 'Contraseña actualizada. Por favor, vuelve a iniciar sesión' });
  } catch (err) {
    next(err);
  }
}

// ── 10. Invitar compañero — POST /api/user/invite ────────────────────────────

export async function inviteUser(req, res, next) {
  try {
    const { email, name, lastName } = req.body;

    if (!req.user.company) {
      throw AppError.badRequest('Debes tener una compañía para invitar compañeros');
    }

    const verificationCode = generateVerificationCode();
    const tempPassword = await bcrypt.hash(crypto.randomUUID(), 12);

    const invited = await User.create({
      email,
      name,
      lastName,
      password: tempPassword,
      role: 'guest',
      company: req.user.company,
      verificationCode,
      verificationAttempts: 3,
    });

    notificationService.emit('user:invited', invited);

    res.status(201).json({
      status: 'success',
      message: 'Usuario invitado correctamente',
      data: { email: invited.email, role: invited.role },
    });
  } catch (err) {
    next(err);
  }
}