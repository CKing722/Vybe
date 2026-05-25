const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

test('AsyncAPI contract validates (backend/contracts/asyncapi.yaml)', async () => {
  const asyncapiPath = path.join(__dirname, '..', 'contracts', 'asyncapi.yaml');

  const { Parser, fromFile } = await import('@asyncapi/parser');
  const parser = new Parser();

  const document = await fromFile(parser, asyncapiPath).validate();
  assert.ok(document);
});

