const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getMemoryState } = require('./memoryStore');
const { loyaltyForSpend } = require('./profileService');

function normalizeSparkTransaction(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    referenceId: row.reference_id || null,
    performerId: row.performer_id || null,
    metadata: row.metadata || null,
    createdAt: row.created_at,
  };
}

async function getSparkBalance(userId) {
  if (!hasDatabase()) {
    const state = getMemoryState();
    const profile = state.viewerProfiles.get(userId);
    if (!profile) {
      throw notFound('Spark balance not found');
    }
    return {
      sparks: Number(profile.sparks || 0),
      totalSpent: Number(profile.total_spent || 0),
      loyalty: loyaltyForSpend(profile.total_spent),
    };
  }

  const { rows } = await query(
    `SELECT sparks, total_spent
     FROM viewer_profiles
     WHERE user_id = $1`,
    [userId]
  );
  if (!rows[0]) {
    throw notFound('Spark balance not found');
  }

  return {
    sparks: Number(rows[0].sparks || 0),
    totalSpent: Number(rows[0].total_spent || 0),
    loyalty: loyaltyForSpend(rows[0].total_spent),
  };
}

async function listSparkTransactions(userId, { limit = 25 } = {}) {
  if (!hasDatabase()) {
    return getMemoryState()
      .sparkTransactions.filter((transaction) => transaction.user_id === userId)
      .slice(-limit)
      .reverse()
      .map(normalizeSparkTransaction);
  }

  const { rows } = await query(
    `SELECT id, user_id, type, amount, balance_after, reference_id, performer_id,
      metadata, created_at
     FROM spark_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows.map(normalizeSparkTransaction);
}

module.exports = {
  getSparkBalance,
  listSparkTransactions,
  normalizeSparkTransaction,
};
