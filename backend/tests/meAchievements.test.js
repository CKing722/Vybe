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

test('viewer achievements endpoint requires auth', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/api/me/achievements`);
    assert.equal(response.status, 401);
  } finally {
    await close();
  }
});

test('viewer achievements endpoint returns deterministic demo achievements', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);

    const response = await fetch(`${baseUrl}/api/me/achievements`, { headers });
    assert.equal(response.status, 200);
    const payload = await response.json();

    assert.equal(payload.userId, MEMORY_IDS.viewer);
    assert.ok(Array.isArray(payload.achievements));
    assert.ok(payload.achievements.length >= 1);

    const first = payload.achievements[0];
    assert.equal(typeof first.id, 'string');
    assert.equal(typeof first.key, 'string');
    assert.equal(typeof first.title, 'string');
    assert.equal(typeof first.description, 'string');
    assert.equal(typeof first.category, 'string');
    assert.equal(typeof first.achievedAt, 'string');

    const keys = payload.achievements.map((item) => item.key);
    assert.ok(keys.includes('first_win'));
    assert.ok(keys.includes('crown_drop'));
    assert.ok(keys.includes('centurion'));

    const response2 = await fetch(`${baseUrl}/api/me/achievements`, { headers });
    assert.equal(response2.status, 200);
    const payload2 = await response2.json();
    assert.deepEqual(payload2.achievements, payload.achievements);
  } finally {
    await close();
  }
});

