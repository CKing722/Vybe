const { hasDatabase, query } = require('../config/db');
const { badRequest, notFound } = require('../utils/errors');
const { getMemoryState } = require('./memoryStore');

function clampLimit(input) {
  if (input === undefined || input === null || input === '') return 10;

  const parsed = Number(input);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw badRequest('limit must be an integer');
  }

  if (parsed < 1 || parsed > 25) {
    throw badRequest('limit must be between 1 and 25');
  }

  return parsed;
}

function normalizeEntry({ userId, displayName, role, avatarUrl, sparksSpent, giftsSent }, rank) {
  return {
    rank,
    user: {
      id: userId,
      displayName,
      role,
      avatarUrl: avatarUrl ?? null,
    },
    sparksSpent,
    giftsSent,
  };
}

async function getGamesLeaderboard(performerIdentifier, { limit } = {}) {
  const leaderboardLimit = clampLimit(limit);

  if (!hasDatabase()) {
    const state = getMemoryState();
    const performer = state.performerDirectory.find(
      (entry) => entry.id === performerIdentifier || entry.slug === performerIdentifier
    );

    if (!performer) {
      throw notFound('Performer not found');
    }

    const totals = new Map();
    for (const giftSent of state.giftsSent) {
      if (giftSent.performer_id !== performer.id) continue;

      const current = totals.get(giftSent.sender_id) || { sparksSpent: 0, giftsSent: 0 };
      current.sparksSpent += Number(giftSent.spark_cost || 0);
      current.giftsSent += 1;
      totals.set(giftSent.sender_id, current);
    }

    const sorted = Array.from(totals.entries())
      .map(([userId, stats]) => {
        const user = state.users.get(userId);
        return {
          userId,
          displayName: user?.display_name || 'Unknown',
          role: user?.role || 'viewer',
          avatarUrl: user?.avatar_url || null,
          sparksSpent: stats.sparksSpent,
          giftsSent: stats.giftsSent,
        };
      })
      .sort(
        (a, b) =>
          b.sparksSpent - a.sparksSpent ||
          b.giftsSent - a.giftsSent ||
          a.displayName.localeCompare(b.displayName)
      )
      .slice(0, leaderboardLimit);

    return {
      performer: {
        id: performer.id,
        slug: performer.slug,
        name: performer.name,
      },
      entries: sorted.map((entry, index) => normalizeEntry(entry, index + 1)),
      generatedAt: new Date().toISOString(),
    };
  }

  const performerResult = await query(
    `SELECT u.id, u.display_name
     FROM users u
     JOIN performer_profiles pp ON pp.user_id = u.id
     WHERE u.id::text = $1 AND u.role = 'performer' AND u.is_active = TRUE`,
    [performerIdentifier]
  );

  if (!performerResult.rows[0]) {
    throw notFound('Performer not found');
  }

  const performerRow = performerResult.rows[0];

  const { rows } = await query(
    `SELECT st.user_id,
      COALESCE(SUM(-st.amount), 0) AS sparks_spent,
      COUNT(*) AS gifts_sent,
      u.display_name,
      u.role,
      u.avatar_url
     FROM spark_transactions st
     JOIN users u ON u.id = st.user_id
     WHERE st.type = 'gift_sent' AND st.performer_id = $1
     GROUP BY st.user_id, u.display_name, u.role, u.avatar_url
     ORDER BY sparks_spent DESC, gifts_sent DESC, u.display_name ASC
     LIMIT $2`,
    [performerRow.id, leaderboardLimit]
  );

  return {
    performer: {
      id: performerRow.id,
      slug: performerRow.id,
      name: performerRow.display_name,
    },
    entries: rows.map((row, index) =>
      normalizeEntry(
        {
          userId: row.user_id,
          displayName: row.display_name,
          role: row.role,
          avatarUrl: row.avatar_url,
          sparksSpent: Number(row.sparks_spent),
          giftsSent: Number(row.gifts_sent),
        },
        index + 1
      )
    ),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getGamesLeaderboard,
  clampLimit,
};

