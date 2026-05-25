const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

async function listJsonFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(resolved)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(resolved);
    }
  }
  return files;
}

test('Socket.io contract schemas are valid JSON with unique $id values', async () => {
  const root = path.join(__dirname, '..', 'contracts', 'socketio', 'v1');
  const schemaFiles = await listJsonFiles(root);

  assert.ok(schemaFiles.length > 0, 'expected at least one schema file');

  const ids = new Set();
  for (const file of schemaFiles) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    assert.equal(typeof parsed.$schema, 'string');
    assert.equal(typeof parsed.$id, 'string');
    assert.ok(!ids.has(parsed.$id), `duplicate $id: ${parsed.$id}`);
    ids.add(parsed.$id);
  }
});

