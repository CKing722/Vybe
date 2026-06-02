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

test('leaderboard endpoint returns ranked spark spend per performer', async () => {
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
    const giftPayload = await sendResponse.json();
    assert.equal(giftPayload.leaderboard.entries.length, 1);
    assert.equal(giftPayload.leaderboard.entries[0].sparksSpent, 500);
    assert.equal(giftPayload.leaderboard.viewerEntry.rank, 1);

    const leaderboardResponse = await fetch(`${baseUrl}/api/games/leaderboard/luna?limit=10`, {
      headers,
    });
    assert.equal(leaderboardResponse.status, 200);

    const leaderboard = await leaderboardResponse.json();
    assert.equal(leaderboard.performer.name, 'Luna Voss');
    assert.equal(leaderboard.entries.length, 1);
    assert.equal(leaderboard.entries[0].rank, 1);
    assert.equal(leaderboard.entries[0].user.displayName, 'VelvetKing');
    assert.equal(leaderboard.entries[0].sparksSpent, 500);
    assert.equal(leaderboard.entries[0].giftsSent, 1);
    assert.ok(typeof leaderboard.generatedAt === 'string' && leaderboard.generatedAt.length > 0);
  } finally {
    await close();
  }
});
