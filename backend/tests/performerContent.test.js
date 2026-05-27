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

test('performer feed endpoint returns deterministic posts', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/performers/luna/feed`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.performerId, MEMORY_IDS.performer);
    assert.ok(Array.isArray(payload.posts));
    assert.ok(payload.posts.length >= 1);
    assert.equal(payload.posts[0].type, 'text');
    assert.equal(typeof payload.posts[0].id, 'string');
    assert.equal(typeof payload.posts[0].createdAt, 'string');
  } finally {
    await close();
  }
});

test('performer feed endpoint respects the limit query parameter', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/performers/luna/feed?limit=1`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.posts.length, 1);
  } finally {
    await close();
  }
});

test('performer requests endpoint returns request menu items', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/performers/luna/requests`);
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.performerId, MEMORY_IDS.performer);
    assert.ok(Array.isArray(payload.requests));
    assert.ok(payload.requests.length >= 1);
    assert.equal(typeof payload.requests[0].id, 'string');
    assert.equal(typeof payload.requests[0].name, 'string');
    assert.equal(typeof payload.requests[0].sparkCost, 'number');
  } finally {
    await close();
  }
});

test('performer content endpoints return 404 for unknown performers', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const feedResponse = await fetch(`${baseUrl}/api/performers/not-real/feed`);
    assert.equal(feedResponse.status, 404);

    const requestsResponse = await fetch(`${baseUrl}/api/performers/not-real/requests`);
    assert.equal(requestsResponse.status, 404);
  } finally {
    await close();
  }
});

