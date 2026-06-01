const assert = require('node:assert/strict');
const test = require('node:test');

const { emitViewerCount } = require('../sockets/presenceHandler');

test('emitViewerCount emits viewer_count with room socket count', async () => {
  let emitted = null;

  const io = {
    in: () => ({
      allSockets: async () => new Set(['socket-a', 'socket-b', 'socket-c']),
    }),
    to: (roomId) => ({
      emit: (event, payload) => {
        emitted = { roomId, event, payload };
      },
    }),
  };

  await emitViewerCount(io, 'room-123');

  assert.deepEqual(emitted, {
    roomId: 'room-123',
    event: 'viewer_count',
    payload: { count: 3 },
  });
});

test('emitViewerCount does nothing without a room id', async () => {
  let emitCalls = 0;

  const io = {
    in: () => ({
      allSockets: async () => new Set(['socket-a']),
    }),
    to: () => ({
      emit: () => {
        emitCalls += 1;
      },
    }),
  };

  await emitViewerCount(io, null);
  assert.equal(emitCalls, 0);
});
