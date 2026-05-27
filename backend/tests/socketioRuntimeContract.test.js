process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { io: createClient } = require('socket.io-client');
const { createApp } = require('../app');
const { configureSockets } = require('../sockets');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');
const { resetStormState } = require('../services/stormService');

async function listJsonFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(resolved)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(resolved);
    }
  }
  return files;
}

async function loadSocketIoContractAjv() {
  const root = path.join(__dirname, '..', 'contracts', 'socketio', 'v1');
  const schemaFiles = await listJsonFiles(root);
  assert.ok(schemaFiles.length > 0, 'expected at least one socket.io contract schema file');

  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);

  for (const file of schemaFiles) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    ajv.addSchema(parsed, parsed.$id);
  }

  return ajv;
}

function validateOrThrow(validator, payload, label) {
  if (!validator(payload)) {
    const message = `${label} failed JSON Schema validation: ${JSON.stringify(validator.errors)}`;
    throw new Error(message);
  }
}

async function startTestServerWithSockets() {
  const app = createApp();
  const server = http.createServer(app);
  configureSockets(server, app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    socketUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
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
  assert.ok(typeof payload.accessToken === 'string' && payload.accessToken.length > 0);
  return payload.accessToken;
}

function waitForEvent(socket, eventName, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), timeoutMs);
    socket.once(eventName, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function emitWithAck(socket, eventName, payload, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName} ack`)), timeoutMs);
    socket.emit(eventName, payload, (ack) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

test('Socket.io runtime emits contract-compliant payloads for gifts, banners, and storms', async () => {
  resetMemoryStore();
  resetStormState();

  const ajv = await loadSocketIoContractAjv();
  const validateJoin = ajv.getSchema(
    'vybe://contracts/socketio/v1/client-to-server/join_room.schema.json'
  );
  const validateSendGift = ajv.getSchema(
    'vybe://contracts/socketio/v1/client-to-server/send_gift.schema.json'
  );
  const validateGiftAnimation = ajv.getSchema(
    'vybe://contracts/socketio/v1/server-to-client/gift_animation.schema.json'
  );
  const validatePlatformBanner = ajv.getSchema(
    'vybe://contracts/socketio/v1/server-to-client/platform_banner.schema.json'
  );
  const validateStormStart = ajv.getSchema(
    'vybe://contracts/socketio/v1/server-to-client/spark_storm_start.schema.json'
  );
  const validateStormUpdate = ajv.getSchema(
    'vybe://contracts/socketio/v1/server-to-client/spark_storm_update.schema.json'
  );
  const validateStormComplete = ajv.getSchema(
    'vybe://contracts/socketio/v1/server-to-client/spark_storm_complete.schema.json'
  );
  const validateViewerCount = ajv.getSchema(
    'vybe://contracts/socketio/v1/server-to-client/viewer_count.schema.json'
  );

  assert.ok(validateJoin);
  assert.ok(validateSendGift);
  assert.ok(validateGiftAnimation);
  assert.ok(validatePlatformBanner);
  assert.ok(validateStormStart);
  assert.ok(validateStormUpdate);
  assert.ok(validateStormComplete);
  assert.ok(validateViewerCount);

  const { baseUrl, socketUrl, close } = await startTestServerWithSockets();
  const accessToken = await loginViewer(baseUrl);

  const socket = createClient(socketUrl, {
    transports: ['websocket'],
    auth: { token: accessToken },
    timeout: 2000,
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });

    const joinPayload = { room_id: MEMORY_IDS.room };
    validateOrThrow(validateJoin, joinPayload, 'join_room payload');

    const viewerCountPromise = waitForEvent(socket, 'viewer_count');
    const joinAck = await emitWithAck(socket, 'join_room', joinPayload);
    assert.deepEqual(joinAck, { ok: true, roomId: MEMORY_IDS.room });

    const viewerCount = await viewerCountPromise;
    validateOrThrow(validateViewerCount, viewerCount, 'viewer_count event payload');
    assert.equal(viewerCount.count, 1);

    const sendPayload = {
      performer_id: MEMORY_IDS.performer,
      gift_type_id: 'crown',
      room_id: MEMORY_IDS.room,
    };
    validateOrThrow(validateSendGift, sendPayload, 'send_gift payload');

    const animationPromise = waitForEvent(socket, 'gift_animation');
    const bannerPromise = waitForEvent(socket, 'platform_banner');

    const sendAck = await emitWithAck(socket, 'send_gift', sendPayload);
    assert.equal(sendAck.ok, true);

    const animation = await animationPromise;
    validateOrThrow(validateGiftAnimation, animation, 'gift_animation event payload');

    const banner = await bannerPromise;
    validateOrThrow(validatePlatformBanner, banner, 'platform_banner event payload');

    const startPromise = waitForEvent(socket, 'spark_storm_start', 5000);
    const updatePromise = waitForEvent(socket, 'spark_storm_update', 5000);
    for (let i = 0; i < 4; i += 1) {
      const ack = await emitWithAck(socket, 'send_gift', sendPayload);
      assert.equal(ack.ok, true);
    }
    const start = await startPromise;
    validateOrThrow(validateStormStart, start, 'spark_storm_start event payload');

    const update = await updatePromise;
    validateOrThrow(validateStormUpdate, update, 'spark_storm_update event payload');

    const completePromise = waitForEvent(socket, 'spark_storm_complete', 8000);
    for (let i = 0; i < 10; i += 1) {
      const ack = await emitWithAck(socket, 'send_gift', sendPayload);
      assert.equal(ack.ok, true);
    }
    const complete = await completePromise;
    validateOrThrow(validateStormComplete, complete, 'spark_storm_complete event payload');
  } finally {
    socket.disconnect();
    await close();
  }
});
