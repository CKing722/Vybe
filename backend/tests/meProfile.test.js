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

test('PUT /api/me/profile updates display name and bio', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);

    const updateResponse = await fetch(`${baseUrl}/api/me/profile`, {
      method: 'PUT',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Velvet Emperor', bio: 'New bio' }),
    });

    assert.equal(updateResponse.status, 200);
    const payload = await updateResponse.json();
    assert.equal(payload.user.displayName, 'Velvet Emperor');
    assert.equal(payload.user.bio, 'New bio');

    const meResponse = await fetch(`${baseUrl}/api/me`, { headers });
    assert.equal(meResponse.status, 200);
    const me = await meResponse.json();
    assert.equal(me.user.displayName, 'Velvet Emperor');
    assert.equal(me.user.bio, 'New bio');
  } finally {
    await close();
  }
});

test('PUT /api/me/profile rejects empty bodies', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const headers = await loginViewer(baseUrl);
    const updateResponse = await fetch(`${baseUrl}/api/me/profile`, {
      method: 'PUT',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(updateResponse.status, 400);
  } finally {
    await close();
  }
});

test('PUT /api/me/profile requires authentication', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();

  try {
    const updateResponse = await fetch(`${baseUrl}/api/me/profile`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ display_name: 'Nope' }),
    });

    assert.equal(updateResponse.status, 401);
  } finally {
    await close();
  }
});

