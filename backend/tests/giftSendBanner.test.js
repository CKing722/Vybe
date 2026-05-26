process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');

async function startTestServer() {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
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
  return { authorization: `Bearer ${payload.accessToken}` };
}

test('sending a non-banner gift returns no platform banner', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);

    const sendResponse = await fetch(`${baseUrl}/api/gifts/send`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        performer_id: MEMORY_IDS.performer,
        gift_type_id: 'rose',
        room_id: MEMORY_IDS.room,
      }),
    });

    assert.equal(sendResponse.status, 201);
    const payload = await sendResponse.json();

    assert.equal(payload.giftSent.gift.id, 'rose');
    assert.equal(payload.animation.spectacleTier, 'standard');
    assert.equal(payload.banner, null);

    const bannersResponse = await fetch(`${baseUrl}/api/banners/active`, { headers });
    assert.equal(bannersResponse.status, 200);
    const bannersPayload = await bannersResponse.json();
    assert.equal(Array.isArray(bannersPayload.banners), true);
    assert.equal(bannersPayload.banners.length, 0);
  } finally {
    await close();
  }
});

test('sending a platform banner gift records an active banner', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);

    const sendResponse = await fetch(`${baseUrl}/api/gifts/send`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        performer_id: MEMORY_IDS.performer,
        gift_type_id: 'crown',
        room_id: MEMORY_IDS.room,
      }),
    });

    assert.equal(sendResponse.status, 201);
    const payload = await sendResponse.json();

    assert.equal(payload.giftSent.gift.id, 'crown');
    assert.equal(payload.animation.spectacleTier, 'major');
    assert.equal(payload.banner.giftName, 'Crown Drop');
    assert.equal(payload.banner.sparkAmount, 500);
    assert.equal(payload.banner.performerName, 'Luna Voss');
    assert.equal(payload.banner.senderName, 'VelvetKing');

    const bannersResponse = await fetch(`${baseUrl}/api/banners/active`, { headers });
    assert.equal(bannersResponse.status, 200);
    const bannersPayload = await bannersResponse.json();

    assert.equal(bannersPayload.banners.length, 1);
    assert.equal(bannersPayload.banners[0].id, payload.banner.id);
    assert.equal(bannersPayload.banners[0].giftName, 'Crown Drop');
  } finally {
    await close();
  }
});

