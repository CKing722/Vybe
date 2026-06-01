const { Server } = require('socket.io');
const { env } = require('../config/env');
const { verifyAccessToken } = require('../middleware/auth');
const { registerGiftHandler } = require('./giftHandler');
const { registerPresenceHandler } = require('./presenceHandler');

function configureSockets(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  });

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
    registerPresenceHandler(io, socket);
    registerGiftHandler(io, socket);
  });

  app.set('io', io);
  return io;
}

module.exports = { configureSockets };
