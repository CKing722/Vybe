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

async function login(baseUrl, password = 'vybe-demo') {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'viewer@vybe.local', password }),
  });
  return response;
}

test('viewer profile update persists sanitized account fields', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();
  try {
    const loginResponse = await login(baseUrl);
    assert.equal(loginResponse.status, 200);
    const { accessToken } = await loginResponse.json();

    const updateResponse = await fetch(`${baseUrl}/api/me`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        displayName: '  Known Patron  ',
        email: 'KNOWN@VYBE.LOCAL',
        phoneNumber: ' 555-0100 ',
        bio: 'A short profile note.',
      }),
    });

    assert.equal(updateResponse.status, 200);
    const profile = await updateResponse.json();
    assert.equal(profile.user.displayName, 'Known Patron');
    assert.equal(profile.user.email, 'known@vybe.local');
    assert.equal(profile.user.phoneNumber, '555-0100');
    assert.equal(profile.user.bio, 'A short profile note.');
  } finally {
    await close();
  }
});

test('viewer password update validates current password and rotates credential', async () => {
  resetMemoryStore();
  const { baseUrl, close } = await startTestServer();
  try {
    const loginResponse = await login(baseUrl);
    assert.equal(loginResponse.status, 200);
    const { accessToken } = await loginResponse.json();

    const weakResponse = await fetch(`${baseUrl}/api/me/password`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: 'vybe-demo',
        newPassword: 'weakpass',
      }),
    });
    assert.equal(weakResponse.status, 400);

    const wrongCurrentResponse = await fetch(`${baseUrl}/api/me/password`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: 'not-the-password',
        newPassword: 'N3wStrong!Pass',
      }),
    });
    assert.equal(wrongCurrentResponse.status, 401);

    const updateResponse = await fetch(`${baseUrl}/api/me/password`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: 'vybe-demo',
        newPassword: 'N3wStrong!Pass',
      }),
    });
    assert.equal(updateResponse.status, 200);
    assert.deepEqual(await updateResponse.json(), { passwordUpdated: true });

    const oldLoginResponse = await login(baseUrl);
    assert.equal(oldLoginResponse.status, 401);

    const newLoginResponse = await login(baseUrl, 'N3wStrong!Pass');
    assert.equal(newLoginResponse.status, 200);
  } finally {
    await close();
  }
});
