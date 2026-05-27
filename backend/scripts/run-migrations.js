const fs = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');
const { env } = require('../config/env');

async function main() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations');
  }

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: process.env.PGSSLMODE === 'disable' ? false : undefined,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    for (const file of files) {
      const alreadyApplied = await pool.query('SELECT id FROM schema_migrations WHERE id = $1', [
        file,
      ]);
      if (alreadyApplied.rows[0]) {
        console.log(`skip ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
