const { hasDatabase, query, withTransaction } = require('../config/db');
const { badRequest, forbidden, notFound } = require('../utils/errors');
const { getMemoryState, randomId } = require('./memoryStore');
const {
  refundSparksToProfile,
  refundSparksWithDatabase,
  spendSparksFromProfile,
  spendSparksWithDatabase,
} = require('./sparkLedgerService');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeRequestMenuItem(row) {
  return {
    id: row.id,
    performerId: row.performer_id || row.performerId,
    name: row.name,
    description: row.description || row.desc || '',
    sparkCost: Number(row.spark_cost || row.sparks || 0),
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order || 0),
  };
}

function normalizeRequestPurchase(row) {
  return {
    id: row.id,
    viewerId: row.viewer_id,
    performerId: row.performer_id,
    requestId: row.request_id || null,
    requesterDisplayName: row.requester_display_name || null,
    name: row.request_name || row.name,
    description: row.request_description || row.description || '',
    prompt: row.prompt || null,
    sparkCost: Number(row.spark_cost || 0),
    escrowSparks: Number(row.escrow_sparks || 0),
    purchasedSparksSpent: Number(row.purchased_sparks_spent || 0),
    bonusSparksSpent: Number(row.bonus_sparks_spent || 0),
    performerEarnings: Number(row.performer_earnings || 0),
    platformFee: Number(row.platform_fee || 0),
    status: row.status,
    publicVisible: Boolean(row.public_visible),
    acceptedAt: row.accepted_at || null,
    declinedAt: row.declined_at || null,
    completedAt: row.completed_at || null,
    refundedAt: row.refunded_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function findMemoryPerformer(performerId) {
  const state = getMemoryState();
  const performer = state.performerDirectory.find(
    (item) => item.id === performerId || item.slug === performerId
  );
  if (!performer) throw notFound('Performer not found');
  return performer;
}

function memoryMenuForPerformer(performerId) {
  const performer = findMemoryPerformer(performerId);
  return (performer.requests || []).map((item, index) =>
    normalizeRequestMenuItem({
      id: `${performer.id}:${slugify(item.name)}`,
      performer_id: performer.id,
      name: item.name,
      description: item.desc,
      spark_cost: item.sparks,
      is_active: true,
      sort_order: index,
    })
  );
}

function findMemoryRequest({ performerId, requestId }) {
  const menu = memoryMenuForPerformer(performerId);
  const item = menu.find(
    (candidate) => candidate.id === requestId || slugify(candidate.name) === slugify(requestId)
  );
  if (!item) throw notFound('Request menu item not found');
  return item;
}

async function listPerformerRequestMenu(performerId) {
  if (!performerId) throw badRequest('performerId is required');

  if (!hasDatabase()) {
    return memoryMenuForPerformer(performerId);
  }

  const { rows } = await query(
    `SELECT id, performer_id, name, description, spark_cost, is_active, sort_order
     FROM performer_requests
     WHERE performer_id = $1 AND is_active = TRUE
     ORDER BY sort_order ASC, spark_cost ASC`,
    [performerId]
  );
  return rows.map(normalizeRequestMenuItem);
}

async function createRequestPurchase({ viewerId, performerId, requestId, prompt = null }) {
  if (!viewerId) throw badRequest('viewerId is required');
  if (!performerId) throw badRequest('performerId is required');
  if (!requestId) throw badRequest('requestId is required');

  if (!hasDatabase()) {
    return createRequestPurchaseInMemory({ viewerId, performerId, requestId, prompt });
  }

  return withTransaction((client) =>
    createRequestPurchaseWithDatabase(client, { viewerId, performerId, requestId, prompt })
  );
}

function createRequestPurchaseInMemory({ viewerId, performerId, requestId, prompt }) {
  const state = getMemoryState();
  const viewer = state.users.get(viewerId);
  const performer = findMemoryPerformer(performerId);
  const profile = state.viewerProfiles.get(viewerId);
  if (!viewer || viewer.role !== 'viewer' || !viewer.is_active) {
    throw notFound('Viewer not found');
  }
  if (!profile) throw notFound('Viewer profile not found');

  const request = findMemoryRequest({ performerId: performer.id, requestId });
  const spend = spendSparksFromProfile(profile, request.sparkCost);
  const performerEarnings = Math.floor(request.sparkCost * 0.8);
  const platformFee = request.sparkCost - performerEarnings;
  const now = new Date().toISOString();
  const purchase = {
    id: randomId(),
    viewer_id: viewerId,
    performer_id: performer.id,
    request_id: request.id,
    requester_display_name: viewer.display_name,
    request_name: request.name,
    request_description: request.description,
    prompt,
    spark_cost: request.sparkCost,
    escrow_sparks: request.sparkCost,
    purchased_sparks_spent: spend.purchasedSpent,
    bonus_sparks_spent: spend.bonusSpent,
    performer_earnings: performerEarnings,
    platform_fee: platformFee,
    status: 'pending',
    public_visible: false,
    metadata: { consent_safe_prompt_required: true },
    created_at: now,
    updated_at: now,
  };
  state.requestPurchases.push(purchase);
  state.sparkTransactions.push({
    id: randomId(),
    user_id: viewerId,
    type: 'request_payment',
    amount: -request.sparkCost,
    balance_after: spend.balanceAfter,
    source: 'request_escrow',
    bonus_spark: false,
    reference_id: purchase.id,
    performer_id: performer.id,
    metadata: {
      request_id: request.id,
      request_name: request.name,
      purchased_sparks_spent: spend.purchasedSpent,
      bonus_sparks_spent: spend.bonusSpent,
      escrow: true,
    },
    created_at: now,
  });

  return {
    request: normalizeRequestPurchase(purchase),
    balance: spend.balanceAfter,
  };
}

async function createRequestPurchaseWithDatabase(client, { viewerId, performerId, requestId, prompt }) {
  const viewerResult = await client.query(
    `SELECT id, display_name
     FROM users
     WHERE id = $1 AND role = 'viewer' AND is_active = TRUE`,
    [viewerId]
  );
  const viewer = viewerResult.rows[0];
  if (!viewer) throw notFound('Viewer not found');

  const requestResult = await client.query(
    `SELECT id, performer_id, name, description, spark_cost
     FROM performer_requests
     WHERE id = $1 AND performer_id = $2 AND is_active = TRUE`,
    [requestId, performerId]
  );
  const request = requestResult.rows[0];
  if (!request) throw notFound('Request menu item not found');

  const spend = await spendSparksWithDatabase(client, viewerId, Number(request.spark_cost));
  const performerEarnings = Math.floor(Number(request.spark_cost) * 0.8);
  const platformFee = Number(request.spark_cost) - performerEarnings;

  const purchaseResult = await client.query(
    `INSERT INTO request_purchases (
      viewer_id, performer_id, request_id, requester_display_name, request_name,
      request_description, prompt, spark_cost, escrow_sparks, purchased_sparks_spent,
      bonus_sparks_spent, performer_earnings, platform_fee, status, public_visible,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, 'pending', FALSE, $13)
    RETURNING *`,
    [
      viewerId,
      performerId,
      request.id,
      viewer.display_name,
      request.name,
      request.description,
      prompt,
      Number(request.spark_cost),
      spend.purchasedSpent,
      spend.bonusSpent,
      performerEarnings,
      platformFee,
      { consent_safe_prompt_required: true },
    ]
  );
  const purchase = purchaseResult.rows[0];

  await client.query(
    `INSERT INTO spark_transactions (
      user_id, type, amount, balance_after, source, bonus_spark,
      reference_id, performer_id, metadata
    )
    VALUES ($1, 'request_payment', $2, $3, 'request_escrow', FALSE, $4, $5, $6)`,
    [
      viewerId,
      -Number(request.spark_cost),
      spend.balanceAfter,
      purchase.id,
      performerId,
      {
        request_id: request.id,
        request_name: request.name,
        purchased_sparks_spent: spend.purchasedSpent,
        bonus_sparks_spent: spend.bonusSpent,
        escrow: true,
      },
    ]
  );

  return {
    request: normalizeRequestPurchase(purchase),
    balance: spend.balanceAfter,
  };
}

async function listViewerRequests(viewerId, { limit = 25 } = {}) {
  if (!hasDatabase()) {
    return getMemoryState()
      .requestPurchases.filter((item) => item.viewer_id === viewerId)
      .slice(-limit)
      .reverse()
      .map(normalizeRequestPurchase);
  }

  const { rows } = await query(
    `SELECT *
     FROM request_purchases
     WHERE viewer_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [viewerId, limit]
  );
  return rows.map(normalizeRequestPurchase);
}

async function listPerformerRequests(performerId, { status = 'pending', limit = 50 } = {}) {
  if (!hasDatabase()) {
    return getMemoryState()
      .requestPurchases.filter(
        (item) => item.performer_id === performerId && (!status || item.status === status)
      )
      .slice(-limit)
      .reverse()
      .map(normalizeRequestPurchase);
  }

  const params = [performerId, limit];
  const statusClause = status ? 'AND status = $3' : '';
  if (status) params.push(status);
  const { rows } = await query(
    `SELECT *
     FROM request_purchases
     WHERE performer_id = $1 ${statusClause}
     ORDER BY created_at DESC
     LIMIT $2`,
    params
  );
  return rows.map(normalizeRequestPurchase);
}

async function acceptRequest({ performerId, requestPurchaseId }) {
  if (!performerId) throw badRequest('performerId is required');
  if (!requestPurchaseId) throw badRequest('requestPurchaseId is required');

  if (!hasDatabase()) {
    const state = getMemoryState();
    const purchase = state.requestPurchases.find((item) => item.id === requestPurchaseId);
    if (!purchase) throw notFound('Request purchase not found');
    if (purchase.performer_id !== performerId) throw forbidden('Only the performer can accept this request');
    if (purchase.status !== 'pending') throw badRequest('Only pending requests can be accepted');
    const now = new Date().toISOString();
    Object.assign(purchase, {
      status: 'accepted',
      public_visible: true,
      accepted_at: now,
      updated_at: now,
    });
    state.sparkTransactions.push({
      id: randomId(),
      user_id: performerId,
      type: 'request_earned',
      amount: purchase.performer_earnings,
      balance_after: 0,
      source: 'performer_earnings',
      bonus_spark: false,
      reference_id: purchase.id,
      performer_id: performerId,
      metadata: {
        gross_sparks: purchase.spark_cost,
        platform_fee: purchase.platform_fee,
        request_name: purchase.request_name,
      },
      created_at: now,
    });
    return {
      request: normalizeRequestPurchase(purchase),
      publicEvent: makePublicRequestEvent(purchase),
    };
  }

  return withTransaction((client) =>
    acceptRequestWithDatabase(client, { performerId, requestPurchaseId })
  );
}

async function acceptRequestWithDatabase(client, { performerId, requestPurchaseId }) {
  const { rows } = await client.query(
    `SELECT *
     FROM request_purchases
     WHERE id = $1
     FOR UPDATE`,
    [requestPurchaseId]
  );
  const purchase = rows[0];
  if (!purchase) throw notFound('Request purchase not found');
  if (purchase.performer_id !== performerId) {
    throw forbidden('Only the performer can accept this request');
  }
  if (purchase.status !== 'pending') {
    throw badRequest('Only pending requests can be accepted');
  }

  const update = await client.query(
    `UPDATE request_purchases
     SET status = 'accepted', public_visible = TRUE, accepted_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [requestPurchaseId]
  );
  const accepted = update.rows[0];

  await client.query(
    `INSERT INTO spark_transactions (
      user_id, type, amount, balance_after, source, bonus_spark,
      reference_id, performer_id, metadata
    )
    VALUES ($1, 'request_earned', $2, 0, 'performer_earnings', FALSE, $3, $1, $4)`,
    [
      performerId,
      Number(accepted.performer_earnings),
      accepted.id,
      {
        gross_sparks: Number(accepted.spark_cost),
        platform_fee: Number(accepted.platform_fee),
        request_name: accepted.request_name,
      },
    ]
  );

  await client.query(
    `INSERT INTO chat_messages (room_id, sender_id, message, type, metadata)
     VALUES ($1, $2, $3, 'request', $4)`,
    [
      performerId,
      accepted.viewer_id,
      `${accepted.requester_display_name} request accepted: ${accepted.request_name}`,
      makePublicRequestEvent(accepted),
    ]
  );

  return {
    request: normalizeRequestPurchase(accepted),
    publicEvent: makePublicRequestEvent(accepted),
  };
}

async function declineRequest({ performerId, requestPurchaseId, reason = null }) {
  if (!performerId) throw badRequest('performerId is required');
  if (!requestPurchaseId) throw badRequest('requestPurchaseId is required');

  if (!hasDatabase()) {
    const state = getMemoryState();
    const purchase = state.requestPurchases.find((item) => item.id === requestPurchaseId);
    if (!purchase) throw notFound('Request purchase not found');
    if (purchase.performer_id !== performerId) {
      throw forbidden('Only the performer can decline this request');
    }
    if (purchase.status !== 'pending') {
      throw badRequest('Only pending requests can be declined');
    }
    const profile = state.viewerProfiles.get(purchase.viewer_id);
    if (!profile) throw notFound('Viewer profile not found');
    const refund = refundSparksToProfile(profile, {
      purchasedSparks: purchase.purchased_sparks_spent,
      bonusSparks: purchase.bonus_sparks_spent,
      amount: purchase.spark_cost,
    });
    const now = new Date().toISOString();
    const refundId = randomId();
    Object.assign(purchase, {
      status: 'declined',
      public_visible: true,
      declined_at: now,
      refunded_at: now,
      refund_transaction_id: refundId,
      updated_at: now,
      metadata: { ...(purchase.metadata || {}), decline_reason: reason },
    });
    state.sparkTransactions.push({
      id: refundId,
      user_id: purchase.viewer_id,
      type: 'refund',
      amount: purchase.spark_cost,
      balance_after: refund.balanceAfter,
      source: 'request_refund',
      bonus_spark: refund.bonusRefund > 0,
      reference_id: purchase.id,
      performer_id: performerId,
      metadata: {
        request_name: purchase.request_name,
        purchased_sparks_refunded: refund.purchasedRefund,
        bonus_sparks_refunded: refund.bonusRefund,
        reason,
      },
      created_at: now,
    });
    return {
      request: normalizeRequestPurchase(purchase),
      refund,
      publicEvent: makePublicRequestEvent(purchase),
    };
  }

  return withTransaction((client) =>
    declineRequestWithDatabase(client, { performerId, requestPurchaseId, reason })
  );
}

async function declineRequestWithDatabase(client, { performerId, requestPurchaseId, reason }) {
  const { rows } = await client.query(
    `SELECT *
     FROM request_purchases
     WHERE id = $1
     FOR UPDATE`,
    [requestPurchaseId]
  );
  const purchase = rows[0];
  if (!purchase) throw notFound('Request purchase not found');
  if (purchase.performer_id !== performerId) {
    throw forbidden('Only the performer can decline this request');
  }
  if (purchase.status !== 'pending') {
    throw badRequest('Only pending requests can be declined');
  }

  const refund = await refundSparksWithDatabase(client, purchase.viewer_id, {
    purchasedSparks: Number(purchase.purchased_sparks_spent || 0),
    bonusSparks: Number(purchase.bonus_sparks_spent || 0),
    amount: Number(purchase.spark_cost),
  });

  const refundTxn = await client.query(
    `INSERT INTO spark_transactions (
      user_id, type, amount, balance_after, source, bonus_spark,
      reference_id, performer_id, metadata
    )
    VALUES ($1, 'refund', $2, $3, 'request_refund', $4, $5, $6, $7)
    RETURNING id`,
    [
      purchase.viewer_id,
      Number(purchase.spark_cost),
      refund.balanceAfter,
      refund.bonusRefund > 0,
      purchase.id,
      performerId,
      {
        request_name: purchase.request_name,
        purchased_sparks_refunded: refund.purchasedRefund,
        bonus_sparks_refunded: refund.bonusRefund,
        reason,
      },
    ]
  );

  const update = await client.query(
    `UPDATE request_purchases
     SET status = 'declined', public_visible = TRUE, declined_at = NOW(),
       refunded_at = NOW(), refund_transaction_id = $2,
       metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [requestPurchaseId, refundTxn.rows[0].id, JSON.stringify({ decline_reason: reason })]
  );
  const declined = update.rows[0];

  await client.query(
    `INSERT INTO chat_messages (room_id, sender_id, message, type, metadata)
     VALUES ($1, $2, $3, 'request', $4)`,
    [
      performerId,
      declined.viewer_id,
      `${declined.request_name} declined and refunded`,
      makePublicRequestEvent(declined),
    ]
  );

  return {
    request: normalizeRequestPurchase(declined),
    refund,
    publicEvent: makePublicRequestEvent(declined),
  };
}

function makePublicRequestEvent(purchase) {
  return {
    type: purchase.status === 'accepted' ? 'request_accepted' : 'request_declined_refunded',
    requestId: purchase.id,
    performerId: purchase.performer_id,
    viewerId: purchase.viewer_id,
    requesterDisplayName: purchase.requester_display_name,
    name: purchase.request_name,
    sparkCost: Number(purchase.spark_cost || 0),
    status: purchase.status,
    publicVisible: Boolean(purchase.public_visible),
  };
}

module.exports = {
  acceptRequest,
  createRequestPurchase,
  declineRequest,
  listPerformerRequestMenu,
  listPerformerRequests,
  listViewerRequests,
  normalizeRequestMenuItem,
  normalizeRequestPurchase,
};
