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

test('viewer performer history endpoint returns summary + recent gifts', async () => {
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

    const historyResponse = await fetch(`${baseUrl}/api/me/history/luna?limit=10`, { headers });
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json();

    assert.equal(history.performer.name, 'Luna Voss');
    assert.equal(history.summary.sparksSpent, 500);
    assert.equal(history.gifts.length, 1);
    assert.equal(history.gifts[0].giftName, 'Crown Drop');
    assert.equal(history.gifts[0].sparkCost, 500);
  } finally {
    await close();
  }
});

test('viewer performer history endpoint returns 404 for unknown performer', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);
    const historyResponse = await fetch(`${baseUrl}/api/me/history/not-a-real-performer`, {
      headers,
    });
    assert.equal(historyResponse.status, 404);
  } finally {
    await close();
  }
});

