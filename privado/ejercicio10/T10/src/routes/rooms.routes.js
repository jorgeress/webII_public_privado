import { Router } from 'express';
import { Room, RoomSchema } from '../models/room.model.js';
import { Message } from '../models/message.model.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('createdBy', 'username avatar')
      .sort({ createdAt: -1 });

    return res.json({ rooms });
  } catch (err) {
    console.error('List rooms error:', err);
    return res.status(500).json({ error: 'Error al listar salas' });
  }
});

// POST /api/rooms
router.post('/', async (req, res) => {
  try {
    const parsed = RoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { name, description, isPrivate } = parsed.data;

    const existing = await Room.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una sala con ese nombre' });
    }

    const room = await Room.create({
      name,
      description,
      isPrivate,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await room.populate('createdBy', 'username avatar');
    return res.status(201).json({ room });
  } catch (err) {
    console.error('Create room error:', err);
    return res.status(500).json({ error: 'Error al crear sala' });
  }
});

// GET /api/rooms/:id/messages
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    const query = { room: id, deleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

export default router;