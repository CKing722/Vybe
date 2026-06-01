process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { listPerformerFeed } = require('../services/performerFeedService');
const { resetMemoryStore } = require('../services/memoryStore');

async function withServer(handler) {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await handler(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /api/performers/:id/requests returns the request menu in memory mode', async () => {
  resetMemoryStore();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/performers/luna/requests`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body.requests));
    assert.ok(body.requests.length > 0);
    assert.ok(body.requests.some((item) => item.name === 'Song & Vibe' && item.sparkCost === 150));
  });
});

test('GET /api/performers/:id/feed returns demo posts and honors the limit parameter', async () => {
  resetMemoryStore();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/performers/luna/feed?limit=1`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body.feed));
    assert.equal(body.feed.length, 1);
    assert.equal(body.feed[0].type, 'text');
    assert.equal(typeof body.feed[0].text, 'string');
  });
});

test('performer feed endpoints return 404 for unknown performers', async () => {
  resetMemoryStore();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/performers/unknown/feed`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error.code, 'not_found');
  });
});

test('performer request endpoints return 404 for unknown performers', async () => {
  resetMemoryStore();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/performers/unknown/requests`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error.code, 'not_found');
  });
});

test('performer feed service clamps limits and generates stable demo ids', async () => {
  const performer = {
    id: 'demo-performer',
    posts: Array.from({ length: 60 }, (_, index) => ({
      type: 'text',
      text: `post-${index}`,
      createdAt: `2026-01-01T00:00:${String(index).padStart(2, '0')}Z`,
    })),
  };

  const clamped = await listPerformerFeed(performer, { limit: 999 });
  assert.equal(clamped.length, 50);
  assert.equal(clamped[0].id, 'demo-demo-performer-post-0');
  assert.equal(clamped[0].performerId, 'demo-performer');

  const defaulted = await listPerformerFeed(performer, { limit: 'not-a-number' });
  assert.equal(defaulted.length, 20);

  const floored = await listPerformerFeed(performer, { limit: 0 });
  assert.equal(floored.length, 1);
});
