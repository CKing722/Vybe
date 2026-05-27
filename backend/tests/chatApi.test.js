process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');

async function login(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'viewer@vybe.local', password: 'vybe-demo' }),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  return { headers: { authorization: `Bearer ${payload.accessToken}` } };
}

test('chat API lists conversations, fetches message history, and sends messages', async () => {
  resetMemoryStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const { headers } = await login(baseUrl);

    const conversationsResponse = await fetch(`${baseUrl}/api/chat/conversations`, { headers });
    assert.equal(conversationsResponse.status, 200);
    const conversationsPayload = await conversationsResponse.json();
    assert.ok(Array.isArray(conversationsPayload.conversations));
    assert.ok(conversationsPayload.conversations.length >= 1);
    assert.equal(conversationsPayload.conversations[0].user.id, MEMORY_IDS.performer);
    assert.equal(typeof conversationsPayload.conversations[0].lastMessage.message, 'string');

    const historyResponse = await fetch(`${baseUrl}/api/chat/luna`, { headers });
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json();
    assert.equal(history.user.id, MEMORY_IDS.performer);
    assert.ok(Array.isArray(history.messages));
    assert.ok(history.messages.length >= 1);

    const sendResponse = await fetch(`${baseUrl}/api/chat/send`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ recipient_id: 'luna', message: 'Put me on the leaderboard.' }),
    });
    assert.equal(sendResponse.status, 201);
    const sent = await sendResponse.json();
    assert.equal(sent.message.senderId, MEMORY_IDS.viewer);
    assert.equal(sent.message.recipientId, MEMORY_IDS.performer);
    assert.equal(sent.message.message, 'Put me on the leaderboard.');

    const refreshedHistoryResponse = await fetch(`${baseUrl}/api/chat/${MEMORY_IDS.performer}?limit=10`, { headers });
    assert.equal(refreshedHistoryResponse.status, 200);
    const refreshed = await refreshedHistoryResponse.json();
    assert.ok(refreshed.messages.some((message) => message.message === 'Put me on the leaderboard.'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

