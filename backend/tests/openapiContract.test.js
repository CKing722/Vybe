const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const SwaggerParser = require('@apidevtools/swagger-parser');

test('OpenAPI contract validates (backend/contracts/openapi.yaml)', async () => {
  const openapiPath = path.join(__dirname, '..', 'contracts', 'openapi.yaml');
  const api = await SwaggerParser.validate(openapiPath);
  assert.ok(api);
  assert.equal(api.openapi, '3.1.0');
});

