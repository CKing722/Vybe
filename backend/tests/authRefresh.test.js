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

test('refresh endpoint rotates refresh tokens and rejects replays', async () => {
  resetMemoryStore();
  resetRefreshTokenStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@vybe.local', password: 'vybe-demo' }),
    });
    assert.equal(loginResponse.status, 200);

    const originalCookie = cookieValue(loginResponse.headers.get('set-cookie'));
    assert.ok(originalCookie && originalCookie.startsWith('vybe_refresh='));

    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    assert.equal(csrfResponse.status, 200);

    const csrfCookie = cookieValue(csrfResponse.headers.get('set-cookie'));
    assert.ok(csrfCookie && csrfCookie.startsWith('vybe_csrf='));

    const csrfJson = await csrfResponse.json();
    assert.ok(csrfJson && csrfJson.csrfToken);
    const csrfHeaderName = csrfJson.headerName || 'x-vybe-csrf';

    const cookieHeader = `${originalCookie}; ${csrfCookie}`;

    const firstRefresh = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookieHeader, [csrfHeaderName]: csrfJson.csrfToken },
    });
    assert.equal(firstRefresh.status, 200);

    const rotatedCookie = cookieValue(firstRefresh.headers.get('set-cookie'));
    assert.ok(rotatedCookie && rotatedCookie.startsWith('vybe_refresh='));
    assert.notEqual(rotatedCookie, originalCookie);

    const replayRefresh = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookieHeader, [csrfHeaderName]: csrfJson.csrfToken },
    });
    assert.equal(replayRefresh.status, 401);

    const secondRefresh = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `${rotatedCookie}; ${csrfCookie}`, [csrfHeaderName]: csrfJson.csrfToken },
    });
    assert.equal(secondRefresh.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
