process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const SwaggerParser = require('@apidevtools/swagger-parser');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { createApp } = require('../app');
const { MEMORY_IDS, resetMemoryStore } = require('../services/memoryStore');
const { resetStormState } = require('../services/stormService');

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
  assert.ok(typeof payload.accessToken === 'string' && payload.accessToken.length > 0);
  return payload.accessToken;
}

function getOperation(api, openapiPathTemplate, method) {
  const pathItem = api.paths?.[openapiPathTemplate];
  assert.ok(pathItem, `missing OpenAPI path: ${openapiPathTemplate}`);

  const operation = pathItem[method.toLowerCase()];
  assert.ok(operation, `missing OpenAPI operation: ${method.toUpperCase()} ${openapiPathTemplate}`);
  return operation;
}

function getJsonResponseSchema(operation, statusCode) {
  const response = operation.responses?.[String(statusCode)];
  assert.ok(response, `missing OpenAPI response ${statusCode}`);

  const content = response.content?.['application/json'];
  assert.ok(content, `missing application/json response content for ${statusCode}`);

  const schema = content.schema;
  assert.ok(schema, `missing application/json response schema for ${statusCode}`);
  return schema;
}

function validateOrThrow(validator, payload, label) {
  if (!validator(payload)) {
    const message = `${label} failed OpenAPI schema validation: ${JSON.stringify(validator.errors)}`;
    throw new Error(message);
  }
}

test('HTTP endpoints return OpenAPI-compliant JSON payloads (vertical slice)', async () => {
  resetMemoryStore();
  resetStormState();

  const openapiPath = path.join(__dirname, '..', 'contracts', 'openapi.yaml');
  const api = await SwaggerParser.dereference(openapiPath);

  const ajv = new Ajv({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);

  const { baseUrl, close } = await startTestServer();
  try {
    const accessToken = await loginViewer(baseUrl);
    const authHeaders = { authorization: `Bearer ${accessToken}` };

    const cases = [
      {
        name: 'GET /api/performers',
        openapiPath: '/api/performers',
        method: 'get',
        url: `${baseUrl}/api/performers`,
        headers: {},
        expectedStatus: 200,
      },
      {
        name: 'GET /api/performers/{id}',
        openapiPath: '/api/performers/{id}',
        method: 'get',
        url: `${baseUrl}/api/performers/${MEMORY_IDS.performer}`,
        headers: {},
        expectedStatus: 200,
      },
      {
        name: 'GET /api/me',
        openapiPath: '/api/me',
        method: 'get',
        url: `${baseUrl}/api/me`,
        headers: authHeaders,
        expectedStatus: 200,
      },
      {
        name: 'PUT /api/me/profile',
        openapiPath: '/api/me/profile',
        method: 'put',
        url: `${baseUrl}/api/me/profile`,
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: {
          display_name: 'NeonVelvet',
          avatar: 'https://cdn.vybe.local/avatars/neon.png',
          bio: 'I only gift in cinematic.',
        },
        expectedStatus: 200,
      },
      {
        name: 'GET /api/gifts/types',
        openapiPath: '/api/gifts/types',
        method: 'get',
        url: `${baseUrl}/api/gifts/types`,
        headers: {},
        expectedStatus: 200,
      },
      {
        name: 'POST /api/gifts/send',
        openapiPath: '/api/gifts/send',
        method: 'post',
        url: `${baseUrl}/api/gifts/send`,
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: { performer_id: MEMORY_IDS.performer, gift_type_id: 'crown', room_id: MEMORY_IDS.room },
        expectedStatus: 201,
      },
      {
        name: 'GET /api/banners/active',
        openapiPath: '/api/banners/active',
        method: 'get',
        url: `${baseUrl}/api/banners/active`,
        headers: {},
        expectedStatus: 200,
      },
      {
        name: 'POST /api/games/questions',
        openapiPath: '/api/games/questions',
        method: 'post',
        url: `${baseUrl}/api/games/questions`,
        headers: { 'content-type': 'application/json' },
        body: { theme: 'spark storm', count: 3 },
        expectedStatus: 200,
      },
      {
        name: 'GET /api/sparks/balance',
        openapiPath: '/api/sparks/balance',
        method: 'get',
        url: `${baseUrl}/api/sparks/balance`,
        headers: authHeaders,
        expectedStatus: 200,
      },
      {
        name: 'GET /api/sparks/transactions',
        openapiPath: '/api/sparks/transactions',
        method: 'get',
        url: `${baseUrl}/api/sparks/transactions`,
        headers: authHeaders,
        expectedStatus: 200,
      },
    ];

    for (const testCase of cases) {
      const operation = getOperation(api, testCase.openapiPath, testCase.method);
      const schema = getJsonResponseSchema(operation, testCase.expectedStatus);
      const validateResponse = ajv.compile(schema);

      const response = await fetch(testCase.url, {
        method: testCase.method.toUpperCase(),
        headers: testCase.headers,
        body: testCase.body ? JSON.stringify(testCase.body) : undefined,
      });

      assert.equal(
        response.status,
        testCase.expectedStatus,
        `${testCase.name} expected status ${testCase.expectedStatus} but got ${response.status}`
      );

      const payload = await response.json();
      validateOrThrow(validateResponse, payload, testCase.name);
    }
  } finally {
    await close();
  }
});
