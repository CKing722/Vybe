process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { resetMemoryStore } = require('../services/memoryStore');

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

test('api limiter rate-limits by user id when Authorization is present', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);

    for (let i = 0; i < 100; i += 1) {
      const response = await fetch(`${baseUrl}/api/gifts/types`, { headers });
      assert.equal(response.status, 200);
    }

    const limited = await fetch(`${baseUrl}/api/gifts/types`, { headers });
    assert.equal(limited.status, 429);
    const payload = await limited.json();
    assert.equal(payload?.error?.code, 'too_many_requests');
  } finally {
    await close();
  }
});

