import prisma from '../config/prisma.js';
import { encrypt, compare } from '../utils/password.js';
import { tokenSign } from '../utils/jwt.js';

export async function register(req, res) {
  const { email, name, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(409).json({ error: 'El email ya está registrado' });

  const hashedPassword = await encrypt(password);
  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const token = tokenSign({ _id: user.id, role: user.role });
  res.status(201).json({ message: 'Usuario registrado exitosamente', token, user });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const isValid = await compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = tokenSign({ _id: user.id, role: user.role });
  res.json({
    message: 'Sesión iniciada exitosamente',
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, email: true, name: true, role: true, createdAt: true,
      _count: { select: { loans: true, reviews: true } },
    },
  });
  res.json({ user });
}