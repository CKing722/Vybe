process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { io: ioClient } = require('socket.io-client');
const { createApp } = require('../app');
const { configureSockets } = require('../sockets');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');
const { resetStormState } = require('../services/stormService');

function waitForEvent(socket, eventName, { timeoutMs = 2000 } = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    function onEvent(payload) {
      clearTimeout(timeout);
      resolve(payload);
    }

    socket.once(eventName, onEvent);
  });
}

async function startSocketServer() {
  const app = createApp();
  const server = http.createServer(app);
  const io = configureSockets(server, app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  const baseUrl = `http://127.0.0.1:${port}`;
  return {
    baseUrl,
    close: async () => {
      io.close();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

async function loginViewer(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'viewer@vybe.local', password: 'vybe-demo' }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  return payload.accessToken;
}

async function connectAuthedSocket(baseUrl, token) {
  const socket = ioClient(baseUrl, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    extraHeaders: { Origin: 'http://localhost:5173' },
  });

  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', (error) => reject(error));
  });

  return socket;
}

async function joinRoom(socket, roomId) {
  const ack = await new Promise((resolve) => {
    socket.emit('join_room', { room_id: roomId }, (payload) => resolve(payload));
  });

  assert.equal(ack.ok, true);
  assert.equal(ack.roomId, roomId);
}

test('HTTP gift send emits gift_animation + platform_banner to sockets listening in the room', async () => {
  resetMemoryStore();
  resetStormState();

  const { baseUrl, close } = await startSocketServer();
  let socket = null;

  try {
    const token = await loginViewer(baseUrl);
    socket = await connectAuthedSocket(baseUrl, token);
    await joinRoom(socket, MEMORY_IDS.room);

    const animationPromise = waitForEvent(socket, 'gift_animation');
    const bannerPromise = waitForEvent(socket, 'platform_banner');

    const sendResponse = await fetch(`${baseUrl}/api/gifts/send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        performer_id: MEMORY_IDS.performer,
        gift_type_id: 'crown',
        room_id: MEMORY_IDS.room,
      }),
    });

    assert.equal(sendResponse.status, 201);

    const animation = await animationPromise;
    assert.equal(animation.animationType, 'descend');
    assert.equal(animation.gift.id, 'crown');
    assert.equal(animation.spectacleTier, 'major');

    const banner = await bannerPromise;
    assert.equal(banner.giftName, 'Crown Drop');
    assert.equal(banner.sparkAmount, 500);
  } finally {
    if (socket) socket.disconnect();
    await close();
  }
});

test('socket send_gift triggers Spark Storm start event once velocity threshold is hit', async () => {
  resetMemoryStore();
  resetStormState();

  const { baseUrl, close } = await startSocketServer();
  let socket = null;

  try {
    const token = await loginViewer(baseUrl);
    socket = await connectAuthedSocket(baseUrl, token);
    await joinRoom(socket, MEMORY_IDS.room);

    const startPromise = waitForEvent(socket, 'spark_storm_start', { timeoutMs: 3000 });

    for (let i = 0; i < 5; i += 1) {
      const ack = await new Promise((resolve) => {
        socket.emit(
          'send_gift',
          {
            performer_id: MEMORY_IDS.performer,
            gift_type_id: 'rose',
            room_id: MEMORY_IDS.room,
          },
          (payload) => resolve(payload)
        );
      });
      assert.equal(ack.ok, true);
    }

    const startEvent = await startPromise;
    assert.equal(startEvent.roomId, MEMORY_IDS.room);
    assert.equal(startEvent.performerId, MEMORY_IDS.performer);
    assert.equal(startEvent.current, 25);
    assert.equal(startEvent.target, 1000);
  } finally {
    if (socket) socket.disconnect();
    await close();
  }
});
