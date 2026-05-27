const crypto = require('crypto');
const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getMemoryState } = require('./memoryStore');

const ACHIEVEMENT_DEFINITIONS = {
  first_win: {
    title: 'First Win',
    description: 'Win your first game.',
    category: 'games',
  },
  crown_drop: {
    title: 'Crown Drop',
    description: 'Send a Crown Drop gift.',
    category: 'gifts',
  },
  centurion: {
    title: 'Centurion',
    description: 'Spend 10,000 sparks.',
    category: 'sparks',
  },
};

function stableUuid(...parts) {
  const hash = crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

function normalizeAchievement(row, userId) {
  const key = row.achievement_key || row.key;
  const achievedAt = row.achieved_at ? new Date(row.achieved_at).toISOString() : null;
  const definition = ACHIEVEMENT_DEFINITIONS[key] || { title: key, description: '', category: 'misc' };

  return {
    id: row.id || stableUuid('achievement', userId, key),
    key,
    title: definition.title,
    description: definition.description,
    category: definition.category,
    achievedAt,
  };
}

async function getViewerAchievements(userId) {
  if (!hasDatabase()) {
    const state = getMemoryState();
    const user = state.users.get(userId);
    if (!user) {
      throw notFound('Viewer profile not found');
    }

    const achievements = (state.viewerAchievements.get(userId) || [])
      .map((row) => normalizeAchievement(row, userId))
      .sort((a, b) => (b.achievedAt || '').localeCompare(a.achievedAt || ''));

    return { userId, achievements };
  }

  const { rows: viewerRows } = await query(
    `SELECT id
     FROM users
     WHERE id = $1 AND role = 'viewer' AND is_active = TRUE`,
    [userId]
  );

  if (!viewerRows[0]) {
    throw notFound('Viewer profile not found');
  }

  const { rows } = await query(
    `SELECT id, achievement_key, achieved_at
     FROM viewer_achievements
     WHERE user_id = $1
     ORDER BY achieved_at DESC`,
    [userId]
  );

  return {
    userId,
    achievements: rows.map((row) => normalizeAchievement(row, userId)),
  };
}

module.exports = {
  getViewerAchievements,
};

