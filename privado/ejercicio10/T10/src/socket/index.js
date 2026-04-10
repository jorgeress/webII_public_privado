import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/user.model.js';
import { registerChatHandlers } from './handlers/chat.handler.js';
import { registerRoomHandlers } from './handlers/room.handler.js';

// In-memory online users: userId -> socketId
const onlineUsers = new Map();

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Auth middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Token no proporcionado'));

      const payload = verifyToken(token);
      const user = await User.findById(payload.userId).select('-password');
      if (!user) return next(new Error('Usuario no encontrado'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 ${socket.user.username} conectado (${socket.id})`);

    // Join personal room for DMs
    socket.join(`user:${userId}`);

    // Mark online
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId });

    // Send current online list to new user
    socket.emit('users:online', { userIds: Array.from(onlineUsers.keys()) });

    // Register handlers
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`🔌 ${socket.user.username} desconectado`);
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit('user:offline', { userId });
    });
  });

  return io;
}