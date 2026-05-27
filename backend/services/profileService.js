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
      ageVerified: Boolean(user.age_verified || user.is_verified),
      phoneNumber: user.phone_number || null,
      countryCode: user.country_code || null,
      regionCode: user.region_code || null,
    },
    viewer: {
      sparks: Number(profile.sparks || 0),
      purchasedSparks: Number(profile.purchased_sparks || profile.sparks || 0),
      bonusSparks: Number(profile.bonus_sparks || 0),
      bonusSparksExpiresAt: profile.bonus_sparks_expires_at || null,
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
      dailyLoginStreak: Number(profile.daily_login_streak || 0),
      priorityWeight: Number(profile.priority_weight || 1),
      vipMembershipStatus: profile.vip_membership_status || 'none',
      monthlySessionCreditType: profile.monthly_session_credit_type || null,
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
      u.phone_number, u.country_code, u.region_code, u.is_verified, u.age_verified,
      vp.sparks, vp.purchased_sparks, vp.bonus_sparks, vp.bonus_sparks_expires_at,
      vp.total_spent, vp.games_played, vp.games_won,
      vp.top_streak, vp.sparks_earned, vp.total_sessions, vp.reputation_score,
      vp.daily_login_streak, vp.priority_weight, vp.vip_membership_status,
      vp.monthly_session_credit_type
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

module.exports = {
  getCurrentViewer,
  loyaltyForSpend,
  publicViewerProfile,
};
