const { hasDatabase, query } = require('../config/db');
const { getPerformer } = require('./performerService');

const DEMO_LEADERBOARDS = {
  luna: [
    {
      viewerId: '11111111-1111-4111-8111-111111111111',
      displayName: 'VelvetKing',
      avatarUrl: null,
      sparksSpent: 8650,
      lastInteraction: '2026-05-26T04:20:00.000Z',
    },
    {
      viewerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      displayName: 'NeonDuke',
      avatarUrl: null,
      sparksSpent: 5400,
      lastInteraction: '2026-05-25T23:12:00.000Z',
    },
    {
      viewerId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      displayName: 'SilkSyndicate',
      avatarUrl: null,
      sparksSpent: 3100,
      lastInteraction: '2026-05-25T18:01:00.000Z',
    },
  ],
  jade: [
    {
      viewerId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      displayName: 'CrownDealer',
      avatarUrl: null,
      sparksSpent: 11200,
      lastInteraction: '2026-05-26T02:44:00.000Z',
    },
    {
      viewerId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      displayName: 'HighRoller',
      avatarUrl: null,
      sparksSpent: 7800,
      lastInteraction: '2026-05-25T21:08:00.000Z',
    },
  ],
  raven: [
    {
      viewerId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      displayName: 'MidnightMint',
      avatarUrl: null,
      sparksSpent: 6200,
      lastInteraction: '2026-05-25T20:15:00.000Z',
    },
    {
      viewerId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      displayName: 'DareBaron',
      avatarUrl: null,
      sparksSpent: 4100,
      lastInteraction: '2026-05-25T19:03:00.000Z',
    },
  ],
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeEntries(rows, limit) {
  return rows.slice(0, limit).map((row, index) => ({
    rank: index + 1,
    viewerId: row.viewerId,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl ?? null,
    sparksSpent: Number(row.sparksSpent || 0),
    lastInteraction: row.lastInteraction ?? null,
  }));
}

async function listPerformerLeaderboardEntries({ performerId, performerSlug }, limit) {
  if (!hasDatabase()) {
    const fallback = DEMO_LEADERBOARDS[performerSlug] || DEMO_LEADERBOARDS.luna;
    return normalizeEntries(fallback, limit);
  }

  const { rows } = await query(
    `SELECT vph.viewer_id,
      u.display_name,
      u.avatar_url,
      vph.sparks_spent,
      vph.last_interaction
     FROM viewer_performer_history vph
     JOIN users u ON u.id = vph.viewer_id
     WHERE vph.performer_id = $1
     ORDER BY vph.sparks_spent DESC, vph.last_interaction DESC NULLS LAST
     LIMIT $2`,
    [performerId, limit]
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    viewerId: row.viewer_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? null,
    sparksSpent: Number(row.sparks_spent || 0),
    lastInteraction: row.last_interaction ?? null,
  }));
}

async function getPerformerLeaderboard(performerIdentifier, { limit = 25 } = {}) {
  const performer = await getPerformer(performerIdentifier);
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 25));
  const entries = await listPerformerLeaderboardEntries(
    { performerId: performer.id, performerSlug: performer.slug },
    safeLimit
  );

  return {
    performerId: performer.id,
    updatedAt: nowIso(),
    entries,
  };
}

module.exports = {
  getPerformerLeaderboard,
};
