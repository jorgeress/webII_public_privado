import { Room } from '../../models/room.model.js';
import { Message } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';

// In-memory store: roomId -> Set of { userId, username, avatar, socketId }
const roomUsers = new Map();

export function getRoomUsers(roomId) {
  return Array.from(roomUsers.get(roomId) || []);
}

export function registerRoomHandlers(io, socket) {
  // Join room
  socket.on('room:join', async (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return socket.emit('error', { message: 'roomId requerido' });

      const room = await Room.findById(roomId).populate('createdBy', 'username avatar');
      if (!room) return socket.emit('error', { message: 'Sala no encontrada' });

      // Join socket room
      socket.join(roomId);

      // Track user in room
      if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
      roomUsers.get(roomId).set(socket.user._id.toString(), {
        _id: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar,
        socketId: socket.id,
      });

      // Add to members if not already
      await Room.findByIdAndUpdate(roomId, {
        $addToSet: { members: socket.user._id },
      });

      const users = Array.from(roomUsers.get(roomId).values());

      // Load last 50 messages
      const messages = await Message.find({ room: roomId, deleted: false })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      // Confirm join to the user who joined
      socket.emit('room:joined', {
        room,
        users,
        messages: messages.reverse(),
      });

      // Notify others in room
      socket.to(roomId).emit('room:user-joined', {
        user: {
          _id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
        },
      });

      // System message
      await Message.create({
        room: roomId,
        sender: socket.user._id,
        content: `${socket.user.username} se ha unido a la sala`,
        type: 'system',
      });

      io.to(roomId).emit('chat:system', {
        content: `${socket.user.username} se ha unido a la sala`,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('room:join error:', err);
      socket.emit('error', { message: 'Error al unirse a la sala' });
    }
  });

  // Leave room
  socket.on('room:leave', async (data) => {
    try {
      const { roomId } = data || {};
      if (!roomId) return;

      socket.leave(roomId);

      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.user._id.toString());
        if (roomUsers.get(roomId).size === 0) roomUsers.delete(roomId);
      }

      socket.to(roomId).emit('room:user-left', {
        user: {
          _id: socket.user._id,
          username: socket.user.username,
        },
      });

      io.to(roomId).emit('chat:system', {
        content: `${socket.user.username} ha abandonado la sala`,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('room:leave error:', err);
    }
  });

  // Handle disconnect
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      if (!roomUsers.has(roomId)) continue;

      roomUsers.get(roomId).delete(socket.user._id.toString());
      if (roomUsers.get(roomId).size === 0) roomUsers.delete(roomId);

      socket.to(roomId).emit('room:user-left', {
        user: {
          _id: socket.user._id,
          username: socket.user.username,
        },
      });
    }
  });
}