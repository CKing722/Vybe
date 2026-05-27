const { hasDatabase, withTransaction } = require('../config/db');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { createPlatformBanner } = require('./bannerService');
const { getGiftType } = require('./giftCatalog');
const { getMemoryState, randomId } = require('./memoryStore');
const { spendSparksFromProfile, spendSparksWithDatabase } = require('./sparkLedgerService');

function giftAnimationPayload({ gift, senderName, giftId }) {
  return {
    giftId,
    senderName,
    gift: {
      id: gift.id,
      name: gift.name,
      cost: gift.cost,
      color: gift.color,
      icon: gift.icon,
    },
    animationType: gift.animationType,
    durationMs: gift.animationDurationMs,
    spectacleTier: gift.cost >= 5000 ? 'cinematic' : gift.cost >= 500 ? 'major' : 'standard',
  };
}

function validateGiftInput(input) {
  if (!input.senderId) throw badRequest('senderId is required');
  if (!input.performerId) throw badRequest('performerId is required');
  if (!input.giftTypeId) throw badRequest('giftTypeId is required');
  if (!input.roomId) throw badRequest('roomId is required');
}

async function sendGift(input) {
  validateGiftInput(input);

  if (!hasDatabase()) {
    return sendGiftInMemory(input);
  }

  return withTransaction((client) => sendGiftWithDatabase(client, input));
}

async function sendGiftInMemory({ senderId, performerId, giftTypeId, roomId }) {
  const state = getMemoryState();
  const gift = await getGiftType(giftTypeId);
  const sender = state.users.get(senderId);
  const performer = state.users.get(performerId);
  const viewerProfile = state.viewerProfiles.get(senderId);

  if (!sender || sender.role !== 'viewer' || !sender.is_active) {
    throw notFound('Viewer not found');
  }
  if (!performer || performer.role !== 'performer' || !performer.is_active) {
    throw notFound('Performer not found');
  }
  if (!viewerProfile) {
    throw notFound('Viewer profile not found');
  }
  const performerEarnings = Math.floor(gift.cost * 0.8);
  const platformFee = gift.cost - performerEarnings;
  const spend = spendSparksFromProfile(viewerProfile, gift.cost);

  const giftSent = {
    id: randomId(),
    sender_id: senderId,
    performer_id: performerId,
    gift_type_id: gift.id,
    spark_cost: gift.cost,
    performer_earnings: performerEarnings,
    platform_fee: platformFee,
    room_id: roomId,
    created_at: new Date().toISOString(),
  };
  state.giftsSent.push(giftSent);

  state.sparkTransactions.push({
    id: randomId(),
    user_id: senderId,
    type: 'gift_sent',
    amount: -gift.cost,
    balance_after: spend.balanceAfter,
    source: 'gift',
    bonus_spark: false,
    reference_id: giftSent.id,
    performer_id: performerId,
    metadata: {
      gift_type_id: gift.id,
      room_id: roomId,
      purchased_sparks_spent: spend.purchasedSpent,
      bonus_sparks_spent: spend.bonusSpent,
      closed_loop: true,
    },
    created_at: giftSent.created_at,
  });

  state.sparkTransactions.push({
    id: randomId(),
    user_id: performerId,
    type: 'gift_received',
    amount: performerEarnings,
    balance_after: 0,
    source: 'performer_earnings',
    bonus_spark: false,
    reference_id: giftSent.id,
    performer_id: performerId,
    metadata: { gross_sparks: gift.cost, platform_fee: platformFee, room_id: roomId },
    created_at: giftSent.created_at,
  });

  const historyKey = `${senderId}:${performerId}`;
  const history = state.viewerPerformerHistory.get(historyKey) || {
    id: randomId(),
    viewer_id: senderId,
    performer_id: performerId,
    sessions_count: 0,
    sparks_spent: 0,
    first_interaction: giftSent.created_at,
    is_subscribed: false,
  };
  history.sparks_spent += gift.cost;
  history.last_interaction = giftSent.created_at;
  state.viewerPerformerHistory.set(historyKey, history);

  const banner = await createPlatformBanner({
    senderName: sender.display_name,
    performerName: performer.display_name,
    performerId,
    gift,
  });

  return {
    giftSent: {
      id: giftSent.id,
      roomId,
      senderId,
      senderName: sender.display_name,
      performerId,
      performerName: performer.display_name,
      gift,
      sparkCost: gift.cost,
      performerEarnings,
      platformFee,
      createdAt: giftSent.created_at,
    },
    balance: spend.balanceAfter,
    balanceDetails: {
      purchasedSparks: spend.purchasedSparks,
      bonusSparks: spend.bonusSparks,
      purchasedSparksSpent: spend.purchasedSpent,
      bonusSparksSpent: spend.bonusSpent,
    },
    animation: giftAnimationPayload({
      gift,
      senderName: sender.display_name,
      giftId: giftSent.id,
    }),
    banner,
  };
}

async function sendGiftWithDatabase(client, { senderId, performerId, giftTypeId, roomId }) {
  const gift = await getGiftType(giftTypeId, client);

  const viewerResult = await client.query(
    `SELECT u.id, u.display_name, vp.sparks
     FROM users u
     JOIN viewer_profiles vp ON vp.user_id = u.id
     WHERE u.id = $1 AND u.role = 'viewer' AND u.is_active = TRUE
     FOR UPDATE OF vp`,
    [senderId]
  );
  const viewer = viewerResult.rows[0];
  if (!viewer) {
    throw notFound('Viewer not found');
  }
  const performerResult = await client.query(
    `SELECT u.id, u.display_name
     FROM users u
     JOIN performer_profiles pp ON pp.user_id = u.id
     WHERE u.id = $1 AND u.role = 'performer' AND u.is_active = TRUE`,
    [performerId]
  );
  const performer = performerResult.rows[0];
  if (!performer) {
    throw notFound('Performer not found');
  }

  const performerEarnings = Math.floor(gift.cost * 0.8);
  const platformFee = gift.cost - performerEarnings;
  const spend = await spendSparksWithDatabase(client, senderId, gift.cost);
  const balanceAfter = spend.balanceAfter;

  const giftResult = await client.query(
    `INSERT INTO gifts_sent (
      sender_id, performer_id, gift_type_id, spark_cost,
      performer_earnings, platform_fee, room_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, created_at`,
    [senderId, performerId, gift.id, gift.cost, performerEarnings, platformFee, roomId]
  );
  const giftSent = giftResult.rows[0];

  await client.query(
    `INSERT INTO spark_transactions (
      user_id, type, amount, balance_after, source, bonus_spark, reference_id, performer_id, metadata
    )
    VALUES
      ($1, 'gift_sent', $2, $3, 'gift', FALSE, $4, $5, $6),
      ($5, 'gift_received', $7, 0, 'performer_earnings', FALSE, $4, $5, $8)`,
    [
      senderId,
      -gift.cost,
      balanceAfter,
      giftSent.id,
      performerId,
      {
        gift_type_id: gift.id,
        room_id: roomId,
        purchased_sparks_spent: spend.purchasedSpent,
        bonus_sparks_spent: spend.bonusSpent,
        closed_loop: true,
      },
      performerEarnings,
      { gross_sparks: gift.cost, platform_fee: platformFee, room_id: roomId },
    ]
  );

  await client.query(
    `INSERT INTO viewer_performer_history (
      viewer_id, performer_id, sparks_spent, first_interaction, last_interaction
    )
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (viewer_id, performer_id)
    DO UPDATE SET
      sparks_spent = viewer_performer_history.sparks_spent + EXCLUDED.sparks_spent,
      last_interaction = NOW()`,
    [senderId, performerId, gift.cost]
  );

  const banner = await createPlatformBanner({
    client,
    senderName: viewer.display_name,
    performerName: performer.display_name,
    performerId,
    gift,
  });

  return {
    giftSent: {
      id: giftSent.id,
      roomId,
      senderId,
      senderName: viewer.display_name,
      performerId,
      performerName: performer.display_name,
      gift,
      sparkCost: gift.cost,
      performerEarnings,
      platformFee,
      createdAt: giftSent.created_at,
    },
    balance: balanceAfter,
    balanceDetails: {
      purchasedSparks: spend.purchasedSparks,
      bonusSparks: spend.bonusSparks,
      purchasedSparksSpent: spend.purchasedSpent,
      bonusSparksSpent: spend.bonusSpent,
    },
    animation: giftAnimationPayload({
      gift,
      senderName: viewer.display_name,
      giftId: giftSent.id,
    }),
    banner,
  };
}

module.exports = {
  giftAnimationPayload,
  sendGift,
};
