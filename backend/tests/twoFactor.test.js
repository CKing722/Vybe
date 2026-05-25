process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { authenticator } = require('otplib');
const { createApp } = require('../app');
const { resetMemoryStore } = require('../services/memoryStore');

test('2FA setup + verify enables TOTP and gates login', async () => {
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
    const login = await loginResponse.json();
    assert.equal(login.user.two_factor_enabled, false);

    const setupResponse = await fetch(`${baseUrl}/api/auth/2fa/setup`, {
      method: 'POST',
      headers: { authorization: `Bearer ${login.accessToken}` },
    });
    assert.equal(setupResponse.status, 200);
    const setup = await setupResponse.json();
    assert.ok(setup.secret);
    assert.ok(setup.otpauthUrl);

    const totp = authenticator.generate(setup.secret);
    const verifyResponse = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${login.accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ token: totp }),
    });
    assert.equal(verifyResponse.status, 200);
    const verified = await verifyResponse.json();
    assert.equal(verified.twoFactorEnabled, true);

    const blockedLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@vybe.local', password: 'vybe-demo' }),
    });
    assert.equal(blockedLoginResponse.status, 401);

    const allowedLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'viewer@vybe.local',
        password: 'vybe-demo',
        twoFactorToken: totp,
      }),
    });
    assert.equal(allowedLoginResponse.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

