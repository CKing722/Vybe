process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
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
