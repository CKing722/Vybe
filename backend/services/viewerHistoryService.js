const { hasDatabase, query } = require('../config/db');
const { notFound } = require('../utils/errors');
const { getGiftType } = require('./giftCatalog');
const { getMemoryState } = require('./memoryStore');
const { getPerformer } = require('./performerService');

function normalizeGiftHistoryEntry(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    giftTypeId: row.gift_type_id,
    giftName: row.gift_name,
    sparkCost: Number(row.spark_cost),
    animationType: row.animation_type || null,
    durationMs: Number(row.animation_duration_ms || 0),
    icon: row.icon || null,
    color: row.color || null,
    createdAt: row.created_at,
  };
}

function emptySummary() {
  return {
    sessionsCount: 0,
    sparksSpent: 0,
    isSubscribed: false,
    firstInteraction: null,
    lastInteraction: null,
  };
}

async function validateViewerExists(viewerId) {
  if (!hasDatabase()) {
    const state = getMemoryState();
    const user = state.users.get(viewerId);
    const profile = state.viewerProfiles.get(viewerId);
    if (!user || user.role !== 'viewer' || !user.is_active || !profile) {
      throw notFound('Viewer not found');
    }
    return;
  }

  const { rows } = await query(
    `SELECT 1
     FROM users u
     JOIN viewer_profiles vp ON vp.user_id = u.id
     WHERE u.id = $1 AND u.role = 'viewer' AND u.is_active = TRUE`,
    [viewerId]
  );
  if (!rows[0]) throw notFound('Viewer not found');
}

async function getViewerPerformerHistory(viewerId, performerIdentifier, { limit = 25 } = {}) {
  const performer = await getPerformer(performerIdentifier);
  await validateViewerExists(viewerId);

  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));

  if (!hasDatabase()) {
    const state = getMemoryState();
    const historyKey = `${viewerId}:${performer.id}`;
    const history = state.viewerPerformerHistory.get(historyKey);

    const gifts = [...state.giftsSent]
      .filter((gift) => gift.sender_id === viewerId && gift.performer_id === performer.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, safeLimit);

    const resolvedGifts = [];
    for (const gift of gifts) {
      const giftType = await getGiftType(gift.gift_type_id);
      resolvedGifts.push(
        normalizeGiftHistoryEntry({
          ...gift,
          gift_name: giftType.name,
          animation_type: giftType.animationType,
          animation_duration_ms: giftType.animationDurationMs,
          icon: giftType.icon,
          color: giftType.color,
        })
      );
    }

    return {
      performer: {
        id: performer.id,
        slug: performer.slug,
        name: performer.name,
        roomId: performer.roomId,
        accent: performer.accent,
      },
      summary: history
        ? {
            sessionsCount: Number(history.sessions_count || 0),
            sparksSpent: Number(history.sparks_spent || 0),
            isSubscribed: Boolean(history.is_subscribed),
            firstInteraction: history.first_interaction || null,
            lastInteraction: history.last_interaction || null,
          }
        : emptySummary(),
      gifts: resolvedGifts,
    };
  }

  const history = await query(
    `SELECT sessions_count, sparks_spent, is_subscribed, first_interaction, last_interaction
     FROM viewer_performer_history
     WHERE viewer_id = $1 AND performer_id = $2`,
    [viewerId, performer.id]
  );

  const { rows } = await query(
    `SELECT gs.id, gs.room_id, gs.gift_type_id, gs.spark_cost, gs.created_at,
      gt.name AS gift_name,
      gt.animation_type,
      gt.animation_duration_ms,
      gt.icon,
      gt.color
     FROM gifts_sent gs
     JOIN gift_types gt ON gt.id = gs.gift_type_id
     WHERE gs.sender_id = $1 AND gs.performer_id = $2
     ORDER BY gs.created_at DESC
     LIMIT $3`,
    [viewerId, performer.id, safeLimit]
  );

  const summaryRow = history.rows[0];
  return {
    performer: {
      id: performer.id,
      slug: performer.slug,
      name: performer.name,
      roomId: performer.roomId,
      accent: performer.accent,
    },
    summary: summaryRow
      ? {
          sessionsCount: Number(summaryRow.sessions_count || 0),
          sparksSpent: Number(summaryRow.sparks_spent || 0),
          isSubscribed: Boolean(summaryRow.is_subscribed),
          firstInteraction: summaryRow.first_interaction || null,
          lastInteraction: summaryRow.last_interaction || null,
        }
      : emptySummary(),
    gifts: rows.map(normalizeGiftHistoryEntry),
  };
}

module.exports = {
  getViewerPerformerHistory,
};
