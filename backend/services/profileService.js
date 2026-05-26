const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getMemoryState, LOYALTY_TIERS } = require('./memoryStore');

function loyaltyForSpend(totalSpent) {
  return [...LOYALTY_TIERS]
    .reverse()
    .find((tier) => Number(totalSpent || 0) >= tier.min);
}

function publicViewerProfile(user, profile) {
  const totalSpent = Number(profile.total_spent || 0);
  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      avatarUrl: user.avatar_url || null,
      bannerUrl: user.banner_url || null,
      bio: user.bio || null,
      isVerified: Boolean(user.is_verified),
    },
    viewer: {
      sparks: Number(profile.sparks || 0),
      totalSpent,
      gamesPlayed: Number(profile.games_played || 0),
      gamesWon: Number(profile.games_won || 0),
      winRate:
        Number(profile.games_played || 0) > 0
          ? Math.round((Number(profile.games_won || 0) / Number(profile.games_played)) * 100)
          : 0,
      topStreak: Number(profile.top_streak || 0),
      sparksEarned: Number(profile.sparks_earned || 0),
      totalSessions: Number(profile.total_sessions || 0),
      reputationScore: Number(profile.reputation_score || 0),
      loyalty: loyaltyForSpend(totalSpent),
    },
  };
}

async function getCurrentViewer(userId) {
  if (!hasDatabase()) {
    const state = getMemoryState();
    const user = state.users.get(userId);
    const profile = state.viewerProfiles.get(userId);
    if (!user || !profile) {
      throw notFound('Viewer profile not found');
    }
    return {
      ...publicViewerProfile(user, profile),
      performerHistory: Array.from(state.viewerPerformerHistory.values())
        .filter((history) => history.viewer_id === userId)
        .map((history) => ({
          performerId: history.performer_id,
          sessionsCount: history.sessions_count,
          sparksSpent: history.sparks_spent,
          isSubscribed: history.is_subscribed,
          firstInteraction: history.first_interaction,
          lastInteraction: history.last_interaction,
        })),
    };
  }

  const { rows } = await query(
    `SELECT u.id, u.email, u.display_name, u.role, u.avatar_url, u.banner_url, u.bio,
      u.is_verified, vp.sparks, vp.total_spent, vp.games_played, vp.games_won,
      vp.top_streak, vp.sparks_earned, vp.total_sessions, vp.reputation_score
     FROM users u
     JOIN viewer_profiles vp ON vp.user_id = u.id
     WHERE u.id = $1 AND u.role = 'viewer' AND u.is_active = TRUE`,
    [userId]
  );

  if (!rows[0]) {
    throw notFound('Viewer profile not found');
  }

  const history = await query(
    `SELECT performer_id, sessions_count, sparks_spent, is_subscribed,
      first_interaction, last_interaction
     FROM viewer_performer_history
     WHERE viewer_id = $1
     ORDER BY last_interaction DESC`,
    [userId]
  );

  return {
    ...publicViewerProfile(rows[0], rows[0]),
    performerHistory: history.rows.map((row) => ({
      performerId: row.performer_id,
      sessionsCount: Number(row.sessions_count || 0),
      sparksSpent: Number(row.sparks_spent || 0),
      isSubscribed: Boolean(row.is_subscribed),
      firstInteraction: row.first_interaction,
      lastInteraction: row.last_interaction,
    })),
  };
}

async function updateViewerProfile(userId, updates) {
  if (!updates || typeof updates !== 'object') {
    return getCurrentViewer(userId);
  }

  if (!hasDatabase()) {
    const state = getMemoryState();
    const user = state.users.get(userId);
    const profile = state.viewerProfiles.get(userId);
    if (!user || !profile || user.role !== 'viewer') {
      throw notFound('Viewer profile not found');
    }

    const nextUser = { ...user };
    for (const [field, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      nextUser[field] = value;
    }
    nextUser.updated_at = new Date().toISOString();
    state.users.set(userId, nextUser);

    return getCurrentViewer(userId);
  }

  const allowedColumns = new Set(['display_name', 'avatar_url', 'banner_url', 'bio']);
  const setClauses = [];
  const values = [userId];
  let index = 2;

  for (const [column, value] of Object.entries(updates)) {
    if (!allowedColumns.has(column)) continue;
    if (value === undefined) continue;
    setClauses.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  }

  if (setClauses.length === 0) {
    return getCurrentViewer(userId);
  }

  const { rowCount } = await query(
    `UPDATE users
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND role = 'viewer' AND is_active = TRUE`,
    values
  );

  if (rowCount === 0) {
    throw notFound('Viewer profile not found');
  }

  return getCurrentViewer(userId);
}

module.exports = {
  getCurrentViewer,
  loyaltyForSpend,
  publicViewerProfile,
  updateViewerProfile,
};
