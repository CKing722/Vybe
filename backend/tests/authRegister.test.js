process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { resetMemoryStore } = require('../services/memoryStore');
const { resetRefreshTokenStore } = require('../services/refreshTokenStore');

function cookieValue(setCookieHeader) {
  if (!setCookieHeader) return null;
  return setCookieHeader.split(';')[0];
}

test('register creates a viewer and issues access + refresh tokens', async () => {
  resetMemoryStore();
  resetRefreshTokenStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'newviewer@vybe.local',
        password: 'vybe-demo-2',
        display_name: 'NeonVelvet',
        role: 'viewer',
      }),
    });
    assert.equal(registerResponse.status, 200);

    const refreshCookie = cookieValue(registerResponse.headers.get('set-cookie'));
    assert.ok(refreshCookie && refreshCookie.startsWith('vybe_refresh='));

    const registerJson = await registerResponse.json();
    assert.equal(registerJson.user.email, 'newviewer@vybe.local');
    assert.equal(registerJson.user.display_name, 'NeonVelvet');
    assert.equal(registerJson.user.role, 'viewer');
    assert.ok(typeof registerJson.accessToken === 'string' && registerJson.accessToken.length > 0);
    assert.equal(registerJson.expiresInSeconds, 15 * 60);

    const meResponse = await fetch(`${baseUrl}/api/me`, {
      method: 'GET',
      headers: { authorization: `Bearer ${registerJson.accessToken}` },
    });
    assert.equal(meResponse.status, 200);

    const meJson = await meResponse.json();
    assert.equal(meJson.user.email, 'newviewer@vybe.local');
    assert.equal(meJson.user.displayName, 'NeonVelvet');
    assert.equal(meJson.user.role, 'viewer');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('register rejects duplicate emails', async () => {
  resetMemoryStore();
  resetRefreshTokenStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const payload = {
      email: 'duplicate@vybe.local',
      password: 'vybe-demo-2',
      display_name: 'Dup',
      role: 'viewer',
    };

    const first = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(first.status, 200);

    const second = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(second.status, 409);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

