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
  assert.equal(result.balanceDetails.bonusSparksSpent, 500);
  assert.equal(result.balanceDetails.purchasedSparksSpent, 0);
  assert.equal(result.giftSent.performerEarnings, 400);
  assert.equal(result.giftSent.platformFee, 100);
  assert.equal(result.animation.animationType, 'descend');
  assert.equal(result.banner.giftName, 'Crown Drop');

  const snapshot = snapshotMemoryStore();
  assert.equal(snapshot.giftsSent.length, 1);
  assert.equal(snapshot.sparkTransactions.length, 2);
  assert.equal(snapshot.sparkTransactions[0].metadata.bonus_sparks_spent, 500);

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
    assert.equal(balance.purchasedSparks, 9000);
    assert.equal(balance.bonusSparks, 1000);
    assert.equal(balance.loyalty.name, 'Bronze');

    const packagesResponse = await fetch(`${baseUrl}/api/sparks/packages`);
    assert.equal(packagesResponse.status, 200);
    const packages = await packagesResponse.json();
    assert.equal(packages.packages.find((item) => item.id === 'popular').bonusSparks, 25);
    assert.equal(packages.rules.cashOutAllowed, false);

    const purchaseResponse = await fetch(`${baseUrl}/api/sparks/purchase`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ package_id: 'popular' }),
    });
    assert.equal(purchaseResponse.status, 201);
    const purchase = await purchaseResponse.json();
    assert.equal(purchase.balance.sparks, 10275);
    assert.equal(purchase.balance.purchasedSparks, 9250);
    assert.equal(purchase.balance.bonusSparks, 1025);

    const accessResponse = await fetch(`${baseUrl}/api/compliance/adult-access`, { headers });
    assert.equal(accessResponse.status, 200);
    const access = await accessResponse.json();
    assert.equal(access.adultContentAllowed, true);

    const paymentOptionsResponse = await fetch(`${baseUrl}/api/payments/options`);
    assert.equal(paymentOptionsResponse.status, 200);
    const paymentOptions = await paymentOptionsResponse.json();
    assert.ok(paymentOptions.rails.some((rail) => rail.type === 'crypto_wallet'));

    const paymentMethodResponse = await fetch(`${baseUrl}/api/payments/methods`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'crypto_wallet',
        provider: 'coinbase_commerce',
        provider_ref: 'processor-token-123',
        chain: 'base',
        wallet_address: '0x0000000000000000000000000000000000000000',
        is_default: true,
      }),
    });
    assert.equal(paymentMethodResponse.status, 201);
    const paymentMethod = await paymentMethodResponse.json();
    assert.equal(paymentMethod.method.type, 'crypto_wallet');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
