const { randomUUID } = require('node:crypto');

function normalizeMessage(message) {
  if (typeof message !== 'string') {
    throw new Error('message must be a string');
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new Error('message is required');
  }
  if (trimmed.length > 500) {
    throw new Error('message must be at most 500 characters');
  }
  return trimmed;
}

function registerChatHandler(io, socket) {
  socket.on('chat_message', async (payload, ack) => {
    try {
      if (!socket.user?.sub) {
        throw new Error('Authentication required');
      }

      const roomId = payload?.room_id || payload?.roomId;
      if (!roomId) {
        throw new Error('room_id is required');
      }

      const message = normalizeMessage(payload?.message);

      const outgoing = {
        messageId: randomUUID(),
        roomId,
        sender: {
          id: socket.user.sub,
          displayName: socket.user.display_name || 'Anonymous',
          role: socket.user.role || 'viewer',
        },
        message,
        createdAt: new Date().toISOString(),
      };

      io.to(roomId).emit('chat_message', outgoing);

      if (typeof ack === 'function') {
        ack({ ok: true, messageId: outgoing.messageId });
      }
    } catch (error) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: error.message });
      }
    }
  });
}

module.exports = { registerChatHandler };

