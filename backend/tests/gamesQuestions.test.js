process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../app');
const { resetMemoryStore } = require('../services/memoryStore');

test('POST /api/games/questions returns deterministic local questions with defaults', async () => {
  resetMemoryStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const firstResponse = await fetch(`${baseUrl}/api/games/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(firstResponse.status, 200);
    const firstPayload = await firstResponse.json();

    assert.equal(firstPayload.provider, 'local');
    assert.equal(firstPayload.paidProviderUsed, false);
    assert.equal(firstPayload.rawProviderApisEnabled, false);
    assert.ok(Array.isArray(firstPayload.questions));
    assert.equal(firstPayload.questions.length, 5);
    assert.ok(typeof firstPayload.questions[0].q === 'string' && firstPayload.questions[0].q.length > 0);
    assert.ok(Array.isArray(firstPayload.questions[0].opts));
    assert.ok(Number.isInteger(firstPayload.questions[0].ans));

    const secondResponse = await fetch(`${baseUrl}/api/games/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(secondResponse.status, 200);
    const secondPayload = await secondResponse.json();

    assert.deepEqual(secondPayload.questions, firstPayload.questions);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/games/questions accepts game_type as an alias for theme', async () => {
  resetMemoryStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const themeResponse = await fetch(`${baseUrl}/api/games/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'spark storm', count: 3 }),
    });
    assert.equal(themeResponse.status, 200);
    const themePayload = await themeResponse.json();
    assert.equal(themePayload.questions.length, 3);

    const aliasResponse = await fetch(`${baseUrl}/api/games/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ game_type: 'spark storm', count: 3 }),
    });
    assert.equal(aliasResponse.status, 200);
    const aliasPayload = await aliasResponse.json();

    assert.deepEqual(aliasPayload.questions, themePayload.questions);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/games/questions rejects invalid count', async () => {
  resetMemoryStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const response = await fetch(`${baseUrl}/api/games/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count: 0 }),
    });
    assert.equal(response.status, 400);

    const payload = await response.json();
    assert.equal(payload.error.code, 'bad_request');
    assert.equal(payload.error.message, 'Request validation failed');
    assert.ok(Array.isArray(payload.error.details?.fields));
    assert.ok(payload.error.details.fields.some((field) => field.field === 'count'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/games/questions rejects theme longer than 64 chars', async () => {
  resetMemoryStore();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const response = await fetch(`${baseUrl}/api/games/questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'a'.repeat(65) }),
    });
    assert.equal(response.status, 400);

    const payload = await response.json();
    assert.equal(payload.error.code, 'bad_request');
    assert.ok(Array.isArray(payload.error.details?.fields));
    assert.ok(payload.error.details.fields.some((field) => field.field === 'theme'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

