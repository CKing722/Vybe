const { Server } = require('socket.io');
const { env } = require('../config/env');
const { verifyAccessToken } = require('../middleware/auth');
const { registerGiftHandler } = require('./giftHandler');

function configureSockets(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  });

  async function emitViewerCount(roomId) {
    if (!roomId) return;
    const sockets = await io.in(roomId).allSockets();
    io.to(roomId).emit('viewer_count', { count: sockets.size });
  }

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (token) {
      try {
        socket.user = verifyAccessToken(token);
      } catch (error) {
        return next(new Error('Invalid socket token'));
      }
    }

    return next();
  });

  io.on('connection', (socket) => {
    socket.on('join_room', async ({ room_id: roomId, roomId: camelRoomId }, ack) => {
      const room = roomId || camelRoomId;
      if (!room) {
        if (typeof ack === 'function') ack({ ok: false, error: 'room_id is required' });
        return;
      }
      await socket.join(room);
      await emitViewerCount(room);
      if (typeof ack === 'function') ack({ ok: true, roomId: room });
    });

    socket.on('leave_room', async ({ room_id: roomId, roomId: camelRoomId }, ack) => {
      const room = roomId || camelRoomId;
      if (room) {
        await socket.leave(room);
        await emitViewerCount(room);
      }
      if (typeof ack === 'function') ack({ ok: true, roomId: room });
    });

    registerGiftHandler(io, socket);
  });

  app.set('io', io);
  return io;
}

module.exports = { configureSockets };
