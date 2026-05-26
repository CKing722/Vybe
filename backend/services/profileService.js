const { hasDatabase, query } = require('../config/db');
const { badRequest, notFound } = require('../utils/errors');
const { getMemoryState, LOYALTY_TIERS } = require('./memoryStore');

function loyaltyForSpend(totalSpent) {
  return [...LOYALTY_TIERS]
    .reverse()
    .find((tier) => Number(totalSpent || 0) >= tier.min);
}

function normalizeOptionalString(value, { maxLength } = {}) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value !== 'string') {
    throw badRequest('Profile fields must be strings');
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (Number.isFinite(maxLength) && trimmed.length > maxLength) {
    throw badRequest(`Profile fields must be at most ${maxLength} characters long`);
  }
  return trimmed;
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
  const nextDisplayNameRaw = normalizeOptionalString(updates.displayName, { maxLength: 50 });
  const nextAvatarUrl = normalizeOptionalString(updates.avatarUrl, { maxLength: 2048 });
  const nextBio = normalizeOptionalString(updates.bio, { maxLength: 2000 });

  const nextDisplayName = nextDisplayNameRaw === null ? undefined : nextDisplayNameRaw;

  if (nextDisplayName === undefined && nextAvatarUrl === undefined && nextBio === undefined) {
    throw badRequest('No profile updates provided');
  }

  if (!hasDatabase()) {
    const state = getMemoryState();
    const user = state.users.get(userId);
    const profile = state.viewerProfiles.get(userId);
    if (!user || !profile || user.role !== 'viewer') {
      throw notFound('Viewer profile not found');
    }

    const updatedUser = { ...user };
    if (nextDisplayName !== undefined) updatedUser.display_name = nextDisplayName;
    if (nextAvatarUrl !== undefined) updatedUser.avatar_url = nextAvatarUrl;
    if (nextBio !== undefined) updatedUser.bio = nextBio;
    updatedUser.updated_at = new Date().toISOString();

    state.users.set(userId, updatedUser);
    return getCurrentViewer(userId);
  }

  const setClauses = [];
  const params = [userId];
  let paramIndex = params.length;

  if (nextDisplayName !== undefined) {
    params.push(nextDisplayName);
    paramIndex += 1;
    setClauses.push(`display_name = $${paramIndex}`);
  }

  if (nextAvatarUrl !== undefined) {
    params.push(nextAvatarUrl);
    paramIndex += 1;
    setClauses.push(`avatar_url = $${paramIndex}`);
  }

  if (nextBio !== undefined) {
    params.push(nextBio);
    paramIndex += 1;
    setClauses.push(`bio = $${paramIndex}`);
  }

  setClauses.push(`updated_at = NOW()`);

  await query(
    `UPDATE users
     SET ${setClauses.join(', ')}
     WHERE id = $1 AND role = 'viewer' AND is_active = TRUE`,
    params
  );

  return getCurrentViewer(userId);
}

module.exports = {
  getCurrentViewer,
  loyaltyForSpend,
  publicViewerProfile,
  updateViewerProfile,
};
