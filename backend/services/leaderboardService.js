const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getMemoryState } = require('./memoryStore');

function resolveMemoryPerformer(identifier) {
  const state = getMemoryState();
  const performer = state.performerDirectory.find(
    (item) => item.id === identifier || item.slug === identifier
  );
  if (!performer) {
    throw notFound('Performer not found');
  }
  return performer;
}

function denseRanks(sortedEntries) {
  let currentRank = 0;
  let lastScore = null;

  return sortedEntries.map((entry, index) => {
    if (lastScore === null || entry.sparksSpent !== lastScore) {
      currentRank = index + 1;
      lastScore = entry.sparksSpent;
    }
    return { ...entry, rank: currentRank };
  });
}

async function leaderboardFromMemory(performerIdentifier, { limit, viewerId } = {}) {
  const performer = resolveMemoryPerformer(performerIdentifier);
  const state = getMemoryState();

  const entries = [];
  for (const history of state.viewerPerformerHistory.values()) {
    if (history.performer_id !== performer.id) continue;
    const viewer = state.users.get(history.viewer_id);
    if (!viewer || !viewer.is_active) continue;

    entries.push({
      viewer: {
        id: history.viewer_id,
        displayName: viewer.display_name,
      },
      sparksSpent: Number(history.sparks_spent || 0),
      lastInteraction: history.last_interaction || null,
    });
  }

  entries.sort((a, b) => {
    if (b.sparksSpent !== a.sparksSpent) return b.sparksSpent - a.sparksSpent;
    return String(b.lastInteraction || '').localeCompare(String(a.lastInteraction || ''));
  });

  const ranked = denseRanks(entries).slice(0, limit).map(({ lastInteraction, ...entry }) => entry);

  let viewerEntry = null;
  if (viewerId) {
    const fullRanked = denseRanks(entries);
    const match = fullRanked.find((entry) => entry.viewer.id === viewerId);
    if (match) {
      const { lastInteraction, ...rest } = match;
      viewerEntry = rest;
    }
  }

  return {
    performer: {
      id: performer.id,
      slug: performer.slug || performer.id,
      name: performer.name,
    },
    entries: ranked,
    viewerEntry,
  };
}

async function leaderboardFromDatabase(performerId, { limit, viewerId } = {}) {
  const performerResult = await query(
    `SELECT u.id, u.display_name
     FROM users u
     WHERE u.id::text = $1 AND u.role = 'performer' AND u.is_active = TRUE`,
    [performerId]
  );
  const performer = performerResult.rows[0];
  if (!performer) {
    throw notFound('Performer not found');
  }

  const { rows } = await query(
    `SELECT vph.viewer_id, u.display_name, vph.sparks_spent, vph.last_interaction
     FROM viewer_performer_history vph
     JOIN users u ON u.id = vph.viewer_id
     WHERE vph.performer_id = $1 AND u.is_active = TRUE
     ORDER BY vph.sparks_spent DESC, vph.last_interaction DESC
     LIMIT $2`,
    [performerId, limit]
  );

  const entries = denseRanks(
    rows.map((row) => ({
      viewer: { id: row.viewer_id, displayName: row.display_name },
      sparksSpent: Number(row.sparks_spent || 0),
      lastInteraction: row.last_interaction ? new Date(row.last_interaction).toISOString() : null,
    }))
  ).map(({ lastInteraction, ...entry }) => entry);

  let viewerEntry = null;
  if (viewerId) {
    const { rows: viewerRows } = await query(
      `SELECT viewer_id, display_name, sparks_spent, rank FROM (
        SELECT vph.viewer_id,
               u.display_name,
               vph.sparks_spent,
               DENSE_RANK() OVER (ORDER BY vph.sparks_spent DESC, vph.last_interaction DESC) AS rank
        FROM viewer_performer_history vph
        JOIN users u ON u.id = vph.viewer_id
        WHERE vph.performer_id = $1 AND u.is_active = TRUE
      ) ranked
      WHERE viewer_id = $2`,
      [performerId, viewerId]
    );

    if (viewerRows[0]) {
      viewerEntry = {
        rank: Number(viewerRows[0].rank),
        viewer: { id: viewerRows[0].viewer_id, displayName: viewerRows[0].display_name },
        sparksSpent: Number(viewerRows[0].sparks_spent || 0),
      };
    }
  }

  return {
    performer: { id: performerId, slug: performerId, name: performer.display_name },
    entries,
    viewerEntry,
  };
}

async function getPerformerLeaderboard(performerIdentifier, { limit = 10, viewerId = null } = {}) {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));

  if (!hasDatabase()) {
    return leaderboardFromMemory(performerIdentifier, { limit: safeLimit, viewerId });
  }

  if (!performerIdentifier) {
    throw notFound('Performer not found');
  }

  return leaderboardFromDatabase(String(performerIdentifier), { limit: safeLimit, viewerId });
}

module.exports = {
  getPerformerLeaderboard,
};
