import { Router } from 'express';
import { User, UserSchema, LoginSchema } from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const parsed = UserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { username, email, password } = parsed.data;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'email' : 'nombre de usuario';
      return res.status(409).json({ error: `El ${field} ya está en uso` });
    }

    const hashed = await hashPassword(password);
    const user = await User.create({ username, email, password: hashed });

    const token = signToken({ userId: user._id });
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = signToken({ userId: user._id });
    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

export default router;