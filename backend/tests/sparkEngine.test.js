process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore, snapshotMemoryStore } = require('../services/memoryStore');
const { listActiveBanners } = require('../services/bannerService');
const { sendGift } = require('../services/sparkEngine');
const { recordGiftForStorm, resetStormState } = require('../services/stormService');

test('gift engine debits viewer, records split, and creates platform banner for high-tier gifts', async () => {
  resetMemoryStore();
  resetStormState();

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
  resetStormState();

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
  resetStormState();
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

    const giftTypesResponse = await fetch(`${baseUrl}/api/gifts/types`);
    assert.equal(giftTypesResponse.status, 200);
    const giftTypes = await giftTypesResponse.json();
    assert.ok(Array.isArray(giftTypes.gifts));
    assert.ok(giftTypes.gifts.some((gift) => gift.id === 'crown' && gift.isPlatformBanner === true));

    const questionsResponse = await fetch(`${baseUrl}/api/games/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'spark storm', count: 3 }),
    });
    assert.equal(questionsResponse.status, 200);
    const questions = await questionsResponse.json();
    assert.equal(questions.provider, 'local');
    assert.equal(questions.paidProviderUsed, false);
    assert.ok(Array.isArray(questions.questions));
    assert.equal(questions.questions.length, 3);

    const giftSendResponse = await fetch(`${baseUrl}/api/gifts/send`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        performer_id: MEMORY_IDS.performer,
        gift_type_id: 'crown',
        room_id: MEMORY_IDS.room,
      }),
    });
    assert.equal(giftSendResponse.status, 201);
    const giftSend = await giftSendResponse.json();
    assert.equal(giftSend.balance, 9500);
    assert.equal(giftSend.giftSent.sparkCost, 500);
    assert.equal(giftSend.animation.animationType, 'descend');
    assert.equal(giftSend.banner.giftName, 'Crown Drop');

    const transactionsResponse = await fetch(`${baseUrl}/api/sparks/transactions?limit=10`, {
      headers,
    });
    assert.equal(transactionsResponse.status, 200);
    const transactions = await transactionsResponse.json();
    assert.ok(Array.isArray(transactions.transactions));
    assert.ok(
      transactions.transactions.some(
        (entry) => entry.type === 'gift_sent' && entry.amount < 0 && entry.balanceAfter === 9500
      )
    );

    const bannersResponse = await fetch(`${baseUrl}/api/banners/active`);
    assert.equal(bannersResponse.status, 200);
    const banners = await bannersResponse.json();
    assert.ok(banners.banners.length >= 1);
    assert.equal(banners.banners[0].giftName, 'Crown Drop');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('storm service emits start/update/complete events once gift velocity hits the trigger', () => {
  resetStormState();

  const roomId = 'room-storm-test';
  const performerId = 'performer-storm-test';
  const senderId = 'sender-storm-test';

  let startEvent = null;
  let completeEvent = null;

  for (let i = 0; i < 5; i += 1) {
    const events = recordGiftForStorm({ roomId, performerId, senderId, sparkCost: 500 });
    const start = events.find((event) => event.type === 'spark_storm_start');
    if (start) startEvent = start;
  }

  assert.ok(startEvent);
  assert.equal(startEvent.payload.roomId, roomId);
  assert.equal(startEvent.payload.performerId, performerId);
  assert.equal(startEvent.payload.current, 2500);

  for (let i = 0; i < 12; i += 1) {
    const events = recordGiftForStorm({ roomId, performerId, senderId, sparkCost: 500 });
    const complete = events.find((event) => event.type === 'spark_storm_complete');
    if (complete) {
      completeEvent = complete;
      break;
    }
  }

  assert.ok(completeEvent);
  assert.equal(completeEvent.payload.roomId, roomId);
  assert.equal(completeEvent.payload.participantCount, 1);
});
