process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  return { baseUrl, server };
}

async function login(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return response.json();
}

test('chat DM endpoints allow sending and listing conversations in memory mode', async () => {
  resetMemoryStore();
  const { baseUrl, server } = await startServer();

  try {
    const viewer = await login(baseUrl, 'viewer@vybe.local', 'vybe-demo');
    const viewerHeaders = {
      authorization: `Bearer ${viewer.accessToken}`,
      'content-type': 'application/json',
    };

    const sendResponse = await fetch(`${baseUrl}/api/chat/send`, {
      method: 'POST',
      headers: viewerHeaders,
      body: JSON.stringify({ recipient_id: MEMORY_IDS.performer, message: 'Hello Luna' }),
    });
    assert.equal(sendResponse.status, 201);
    const sendBody = await sendResponse.json();
    assert.equal(sendBody.message.senderId, MEMORY_IDS.viewer);
    assert.equal(sendBody.message.recipientId, MEMORY_IDS.performer);
    assert.equal(sendBody.message.message, 'Hello Luna');

    const conversationsResponse = await fetch(`${baseUrl}/api/chat/conversations`, {
      headers: { authorization: `Bearer ${viewer.accessToken}` },
    });
    assert.equal(conversationsResponse.status, 200);
    const conversationsBody = await conversationsResponse.json();
    assert.ok(Array.isArray(conversationsBody.conversations));
    assert.ok(conversationsBody.conversations.length >= 1);

    const lunaConversation = conversationsBody.conversations.find(
      (entry) => entry.user.id === MEMORY_IDS.performer
    );
    assert.ok(lunaConversation);
    assert.equal(lunaConversation.lastMessage.message, 'Hello Luna');

    const messagesResponse = await fetch(`${baseUrl}/api/chat/${MEMORY_IDS.performer}`, {
      headers: { authorization: `Bearer ${viewer.accessToken}` },
    });
    assert.equal(messagesResponse.status, 200);
    const messagesBody = await messagesResponse.json();
    assert.ok(Array.isArray(messagesBody.messages));
    assert.equal(messagesBody.messages.length, 1);
    assert.equal(messagesBody.messages[0].message, 'Hello Luna');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('chat DM endpoints require auth', async () => {
  resetMemoryStore();
  const { baseUrl, server } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/api/chat/conversations`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

