async function emitViewerCount(io, roomId) {
  if (!roomId) return;

  const sockets = await io.in(roomId).allSockets();
  io.to(roomId).emit('viewer_count', { count: sockets.size });
}

function getRoomId(payload) {
  if (!payload) return null;
  return payload.room_id || payload.roomId || null;
}

function registerPresenceHandler(io, socket) {
  let roomsOnDisconnect = null;

  socket.on('join_room', async (payload, ack) => {
    try {
      const roomId = getRoomId(payload);
      if (!roomId) {
        if (typeof ack === 'function') ack({ ok: false, error: 'room_id is required' });
        return;
      }

      socket.join(roomId);
      await emitViewerCount(io, roomId);
      if (typeof ack === 'function') ack({ ok: true, roomId });
    } catch (error) {
      if (typeof ack === 'function') ack({ ok: false, error: error.message });
    }
  });

  socket.on('leave_room', async (payload, ack) => {
    try {
      const roomId = getRoomId(payload);

      if (roomId) {
        socket.leave(roomId);
        await emitViewerCount(io, roomId);
      }

      if (typeof ack === 'function') ack({ ok: true, roomId });
    } catch (error) {
      if (typeof ack === 'function') ack({ ok: false, error: error.message });
    }
  });

  socket.on('disconnecting', () => {
    roomsOnDisconnect = Array.from(socket.rooms).filter((roomId) => roomId !== socket.id);
  });

  socket.on('disconnect', () => {
    if (!roomsOnDisconnect) return;
    for (const roomId of roomsOnDisconnect) {
      void emitViewerCount(io, roomId).catch(() => null);
    }
    roomsOnDisconnect = null;
  });
}

module.exports = { emitViewerCount, registerPresenceHandler };
