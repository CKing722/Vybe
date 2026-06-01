process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');
const { sendGift } = require('../services/sparkEngine');

async function withServer(work) {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  try {
    await work({ baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /api/games/leaderboard/:performerId returns empty leaderboard when no gifts were sent', async () => {
  resetMemoryStore();

  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/games/leaderboard/luna`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.performer.slug, 'luna');
    assert.ok(Array.isArray(body.entries));
    assert.equal(body.entries.length, 0);
  });
});

test('GET /api/games/leaderboard/:performerId ranks viewers by sparks spent', async () => {
  resetMemoryStore();

  await sendGift({
    senderId: MEMORY_IDS.viewer,
    performerId: MEMORY_IDS.performer,
    giftTypeId: 'crown',
    roomId: MEMORY_IDS.room,
  });

  await sendGift({
    senderId: MEMORY_IDS.viewer,
    performerId: MEMORY_IDS.performer,
    giftTypeId: 'rose',
    roomId: MEMORY_IDS.room,
  });

  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/games/leaderboard/luna?limit=10`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.performer.slug, 'luna');
    assert.equal(body.entries.length, 1);
    assert.equal(body.entries[0].rank, 1);
    assert.equal(body.entries[0].user.displayName, 'VelvetKing');
    assert.equal(body.entries[0].sparksSpent, 505);
    assert.equal(body.entries[0].giftsSent, 2);
  });
});

