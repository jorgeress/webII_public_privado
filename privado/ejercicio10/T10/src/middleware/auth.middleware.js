import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/user.model.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}