const { Pool } = require('pg');
const { env } = require('./env');
const { serviceUnavailable } = require('../utils/errors');

const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      ssl: process.env.PGSSLMODE === 'disable' ? false : undefined,
    })
  : null;

function hasDatabase() {
  return Boolean(pool);
}

async function query(text, params) {
  if (!pool) {
    throw serviceUnavailable('PostgreSQL is not configured; local memory adapter is active');
  }
  return pool.query(text, params);
}

async function withTransaction(work) {
  if (!pool) {
    throw serviceUnavailable('PostgreSQL is not configured; local memory adapter is active');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  hasDatabase,
  pool,
  query,
  withTransaction,
  closeDatabase,
};
