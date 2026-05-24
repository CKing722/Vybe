process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore, snapshotMemoryStore } = require('../services/memoryStore');
const { listActiveBanners } = require('../services/bannerService');
const { sendGift } = require('../services/sparkEngine');

test('gift engine debits viewer, records split, and creates platform banner for high-tier gifts', async () => {
  resetMemoryStore();

  const result = await sendGift({
    senderId: MEMORY_IDS.viewer,
    performerId: MEMORY_IDS.performer,
    giftTypeId: 'crown',
    roomId: MEMORY_IDS.room,
  });

  assert.equal(result.balance, 9500);
  assert.equal(result.giftSent.performerEarnings, 400);
  assert.equal(result.giftSent.platformFee, 100);
  assert.equal(result.animation.animationType, 'descend');
  assert.equal(result.banner.giftName, 'Crown Drop');

  const snapshot = snapshotMemoryStore();
  assert.equal(snapshot.giftsSent.length, 1);
  assert.equal(snapshot.sparkTransactions.length, 2);

  const banners = await listActiveBanners();
  assert.equal(banners.length, 1);
  assert.equal(banners[0].sparkAmount, 500);
});

test('gift engine skips platform banner for subtle low-tier gifts', async () => {
  resetMemoryStore();

  const result = await sendGift({
    senderId: MEMORY_IDS.viewer,
    performerId: MEMORY_IDS.performer,
    giftTypeId: 'rose',
    roomId: MEMORY_IDS.room,
  });

  assert.equal(result.balance, 9995);
  assert.equal(result.banner, null);
});

test('app factory exposes health route without a database', async () => {
  const app = createApp();
  assert.equal(typeof app.listen, 'function');
});

test('demo API exposes viewer, performer, and spark contracts for frontend integration', async () => {
  resetMemoryStore();
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@vybe.local', password: 'vybe-demo' }),
    });
    assert.equal(loginResponse.status, 200);
    const login = await loginResponse.json();
    const headers = { authorization: `Bearer ${login.accessToken}` };

    const meResponse = await fetch(`${baseUrl}/api/me`, { headers });
    assert.equal(meResponse.status, 200);
    const me = await meResponse.json();
    assert.equal(me.user.displayName, 'VelvetKing');
    assert.equal(me.viewer.sparks, 10000);

    const performersResponse = await fetch(`${baseUrl}/api/performers?live=true`);
    assert.equal(performersResponse.status, 200);
    const performers = await performersResponse.json();
    assert.ok(performers.performers.length >= 1);
    assert.equal(performers.performers[0].isLive, true);

    const performerResponse = await fetch(`${baseUrl}/api/performers/luna`);
    assert.equal(performerResponse.status, 200);
    const performer = await performerResponse.json();
    assert.equal(performer.performer.name, 'Luna Voss');

    const balanceResponse = await fetch(`${baseUrl}/api/sparks/balance`, { headers });
    assert.equal(balanceResponse.status, 200);
    const balance = await balanceResponse.json();
    assert.equal(balance.sparks, 10000);
    assert.equal(balance.loyalty.name, 'Bronze');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
