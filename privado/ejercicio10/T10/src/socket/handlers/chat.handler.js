import { Message, MessageSchema, PrivateMessageSchema } from '../../models/message.model.js';
import { User } from '../../models/user.model.js';

export function registerChatHandlers(io, socket) {
  // Send message to room
  socket.on('chat:message', async (data) => {
    try {
      const parsed = MessageSchema.safeParse(data);
      if (!parsed.success) {
        return socket.emit('error', { message: parsed.error.errors[0].message });
      }

      const { roomId, content } = parsed.data;

      // Check socket is in the room
      if (!socket.rooms.has(roomId)) {
        return socket.emit('error', { message: 'No estás en esa sala' });
      }

      const message = await Message.create({
        room: roomId,
        sender: socket.user._id,
        content,
        type: 'text',
      });

      await message.populate('sender', 'username avatar');

      io.to(roomId).emit('chat:message', {
        _id: message._id,
        room: roomId,
        sender: message.sender,
        content: message.content,
        type: message.type,
        reactions: [],
        edited: false,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('chat:message error:', err);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', (data) => {
    const { roomId } = data || {};
    if (!roomId || !socket.rooms.has(roomId)) return;

    socket.to(roomId).emit('chat:typing', {
      user: { _id: socket.user._id, username: socket.user.username },
    });
  });

  // Reaction to message (bonus)
  socket.on('chat:react', async (data) => {
    try {
      const { messageId, emoji } = data || {};
      if (!messageId || !emoji) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      const existing = message.reactions.find((r) => r.emoji === emoji);
      if (existing) {
        const idx = existing.users.indexOf(socket.user._id);
        if (idx === -1) {
          existing.users.push(socket.user._id);
        } else {
          existing.users.splice(idx, 1);
          if (existing.users.length === 0) {
            message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
          }
        }
      } else {
        message.reactions.push({ emoji, users: [socket.user._id] });
      }

      await message.save();

      const roomId = message.room?.toString();
      if (roomId) {
        io.to(roomId).emit('chat:reaction', {
          messageId,
          reactions: message.reactions,
        });
      }
    } catch (err) {
      console.error('chat:react error:', err);
    }
  });

  // Edit message (bonus)
  socket.on('chat:edit', async (data) => {
    try {
      const { messageId, content } = data || {};
      if (!messageId || !content?.trim()) return;

      const message = await Message.findOne({
        _id: messageId,
        sender: socket.user._id,
        deleted: false,
      });
      if (!message) return;

      message.content = content.trim();
      message.edited = true;
      await message.save();

      const roomId = message.room?.toString();
      if (roomId) {
        io.to(roomId).emit('chat:edited', {
          messageId,
          content: message.content,
          edited: true,
        });
      }
    } catch (err) {
      console.error('chat:edit error:', err);
    }
  });

  // Delete message (bonus)
  socket.on('chat:delete', async (data) => {
    try {
      const { messageId } = data || {};
      if (!messageId) return;

      const message = await Message.findOne({
        _id: messageId,
        sender: socket.user._id,
      });
      if (!message) return;

      message.deleted = true;
      await message.save();

      const roomId = message.room?.toString();
      if (roomId) {
        io.to(roomId).emit('chat:deleted', { messageId });
      }
    } catch (err) {
      console.error('chat:delete error:', err);
    }
  });

  // Private message (bonus)
  socket.on('chat:private', async (data) => {
    try {
      const parsed = PrivateMessageSchema.safeParse(data);
      if (!parsed.success) {
        return socket.emit('error', { message: parsed.error.errors[0].message });
      }

      const { toUserId, content } = parsed.data;

      const recipient = await User.findById(toUserId);
      if (!recipient) {
        return socket.emit('error', { message: 'Usuario no encontrado' });
      }

      const message = await Message.create({
        sender: socket.user._id,
        recipient: toUserId,
        content,
        type: 'text',
      });

      await message.populate('sender', 'username avatar');

      const payload = {
        _id: message._id,
        sender: message.sender,
        recipient: { _id: recipient._id, username: recipient.username },
        content: message.content,
        createdAt: message.createdAt,
      };

      // Send to recipient's personal room
      io.to(`user:${toUserId}`).emit('chat:private', payload);
      // Echo back to sender
      socket.emit('chat:private', payload);
    } catch (err) {
      console.error('chat:private error:', err);
      socket.emit('error', { message: 'Error al enviar mensaje privado' });
    }
  });
}