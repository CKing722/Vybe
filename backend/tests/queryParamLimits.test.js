process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');
const { resetStormState } = require('../services/stormService');

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

async function sendGift(baseUrl, headers, giftTypeId) {
  const response = await fetch(`${baseUrl}/api/gifts/send`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({
      performer_id: MEMORY_IDS.performer,
      gift_type_id: giftTypeId,
      room_id: MEMORY_IDS.room,
    }),
  });
  assert.equal(response.status, 201);
}

test('limit query params default and clamp (sparks transactions, active banners)', async () => {
  resetMemoryStore();
  resetStormState();

  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);

    for (let i = 0; i < 30; i += 1) {
      await sendGift(baseUrl, headers, 'rose');
    }

    const invalidTransactions = await fetch(`${baseUrl}/api/sparks/transactions?limit=not-a-number`, {
      headers,
    });
    assert.equal(invalidTransactions.status, 200);
    const invalidPayload = await invalidTransactions.json();
    assert.equal(invalidPayload.transactions.length, 25);

    const minTransactions = await fetch(`${baseUrl}/api/sparks/transactions?limit=0`, { headers });
    assert.equal(minTransactions.status, 200);
    const minPayload = await minTransactions.json();
    assert.equal(minPayload.transactions.length, 1);

    for (let i = 0; i < 12; i += 1) {
      await sendGift(baseUrl, headers, 'crown');
    }

    const invalidBanners = await fetch(`${baseUrl}/api/banners/active?limit=banana`);
    assert.equal(invalidBanners.status, 200);
    const invalidBannersPayload = await invalidBanners.json();
    assert.equal(invalidBannersPayload.banners.length, 10);

    const limitedBanners = await fetch(`${baseUrl}/api/banners/active?limit=3`);
    assert.equal(limitedBanners.status, 200);
    const limitedPayload = await limitedBanners.json();
    assert.equal(limitedPayload.banners.length, 3);
  } finally {
    await close();
  }
});

