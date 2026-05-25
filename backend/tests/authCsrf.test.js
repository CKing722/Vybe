process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { resetMemoryStore } = require('../services/memoryStore');

function cookieValue(setCookieHeader) {
  if (!setCookieHeader) return null;
  return setCookieHeader.split(';')[0];
}

test('refresh and logout require CSRF double-submit cookie header', async () => {
  resetMemoryStore();

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

    const refreshCookie = cookieValue(loginResponse.headers.get('set-cookie'));
    assert.ok(refreshCookie && refreshCookie.startsWith('vybe_refresh='));

    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, { method: 'GET' });
    assert.equal(csrfResponse.status, 200);
    const csrfPayload = await csrfResponse.json();
    assert.equal(csrfPayload.headerName, 'x-vybe-csrf');
    assert.ok(typeof csrfPayload.csrfToken === 'string' && csrfPayload.csrfToken.length > 0);

    const csrfCookie = cookieValue(csrfResponse.headers.get('set-cookie'));
    assert.ok(csrfCookie && csrfCookie.startsWith('vybe_csrf='));

    const missingHeaderRefresh = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { cookie: `${refreshCookie}; ${csrfCookie}` },
    });
    assert.equal(missingHeaderRefresh.status, 403);

    const okRefresh = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: `${refreshCookie}; ${csrfCookie}`,
        'x-vybe-csrf': csrfPayload.csrfToken,
      },
    });
    assert.equal(okRefresh.status, 200);

    const missingHeaderLogout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie: `${refreshCookie}; ${csrfCookie}` },
    });
    assert.equal(missingHeaderLogout.status, 403);

    const okLogout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: `${refreshCookie}; ${csrfCookie}`,
        'x-vybe-csrf': csrfPayload.csrfToken,
      },
    });
    assert.equal(okLogout.status, 204);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

