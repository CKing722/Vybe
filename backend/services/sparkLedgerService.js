const { hasDatabase, query, withTransaction } = require('../config/db');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { getMemoryState } = require('./memoryStore');
const { loyaltyForSpend } = require('./profileService');

const BONUS_SPARK_EXPIRY_DAYS = 90;

const SPARK_PACKAGES = [
  {
    id: 'starter',
    label: 'Starter',
    priceUsd: 10,
    purchasedSparks: 100,
    bonusSparks: 0,
    totalSparks: 100,
    perSparkCost: 0.1,
  },
  {
    id: 'popular',
    label: 'Popular',
    priceUsd: 25,
    purchasedSparks: 250,
    bonusSparks: 25,
    totalSparks: 275,
    perSparkCost: 0.091,
    featured: true,
  },
  {
    id: 'value',
    label: 'Value',
    priceUsd: 50,
    purchasedSparks: 500,
    bonusSparks: 75,
    totalSparks: 575,
    perSparkCost: 0.087,
  },
  {
    id: 'premium',
    label: 'Premium',
    priceUsd: 100,
    purchasedSparks: 1000,
    bonusSparks: 200,
    totalSparks: 1200,
    perSparkCost: 0.083,
  },
  {
    id: 'high_roller',
    label: 'High Roller',
    priceUsd: 250,
    purchasedSparks: 2500,
    bonusSparks: 625,
    totalSparks: 3125,
    perSparkCost: 0.08,
  },
  {
    id: 'whale',
    label: 'Whale',
    priceUsd: 500,
    purchasedSparks: 5000,
    bonusSparks: 1500,
    totalSparks: 6500,
    perSparkCost: 0.077,
  },
];

function bonusExpiryDate() {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + BONUS_SPARK_EXPIRY_DAYS);
  return expires;
}

function getSparkPackage(packageId) {
  const sparkPackage = SPARK_PACKAGES.find((item) => item.id === packageId);
  if (!sparkPackage) {
    throw badRequest('Unknown spark package');
  }
  return sparkPackage;
}

function numeric(value) {
  return Number(value || 0);
}

function reconcileSparkProfile(profile) {
  if (profile.purchased_sparks == null && profile.bonus_sparks == null) {
    profile.purchased_sparks = numeric(profile.sparks);
    profile.bonus_sparks = 0;
  }
  profile.purchased_sparks = Math.max(0, numeric(profile.purchased_sparks));
  profile.bonus_sparks = Math.max(0, numeric(profile.bonus_sparks));
  profile.sparks = profile.purchased_sparks + profile.bonus_sparks;
  return profile;
}

function normalizeSparkTransaction(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    source: row.source || null,
    bonusSpark: Boolean(row.bonus_spark),
    expiresAt: row.expires_at || null,
    expiredAt: row.expired_at || null,
    softDeletedAt: row.soft_deleted_at || null,
    referenceId: row.reference_id || null,
    performerId: row.performer_id || null,
    metadata: row.metadata || null,
    createdAt: row.created_at,
  };
}

function normalizeSparkBalance(profile) {
  const reconciled = reconcileSparkProfile(profile);
  return {
    sparks: numeric(reconciled.sparks),
    purchasedSparks: numeric(reconciled.purchased_sparks),
    bonusSparks: numeric(reconciled.bonus_sparks),
    bonusSparksExpiresAt: reconciled.bonus_sparks_expires_at || null,
    totalSpent: numeric(reconciled.total_spent),
    loyalty: loyaltyForSpend(reconciled.total_spent),
    closedLoop: true,
    cashOutAllowed: false,
    transferAllowed: false,
  };
}

function spendSparksFromProfile(profile, amount) {
  const cost = Number(amount || 0);
  if (!Number.isInteger(cost) || cost <= 0) {
    throw badRequest('Spark spend amount must be a positive integer');
  }

  reconcileSparkProfile(profile);
  if (profile.sparks < cost) {
    throw conflict('Insufficient sparks', {
      balance: profile.sparks,
      required: cost,
    });
  }

  const bonusSpent = Math.min(profile.bonus_sparks, cost);
  const purchasedSpent = cost - bonusSpent;
  profile.bonus_sparks -= bonusSpent;
  profile.purchased_sparks -= purchasedSpent;
  profile.sparks = profile.bonus_sparks + profile.purchased_sparks;

  return {
    balanceAfter: profile.sparks,
    purchasedSpent,
    bonusSpent,
    purchasedSparks: profile.purchased_sparks,
    bonusSparks: profile.bonus_sparks,
  };
}

function refundSparksToProfile(profile, { purchasedSparks = 0, bonusSparks = 0, amount = null } = {}) {
  reconcileSparkProfile(profile);
  const purchasedRefund = Math.max(0, Number(purchasedSparks || 0));
  let bonusRefund = Math.max(0, Number(bonusSparks || 0));
  const expectedAmount = amount == null ? purchasedRefund + bonusRefund : Number(amount);

  if (!Number.isInteger(expectedAmount) || expectedAmount <= 0) {
    throw badRequest('Refund amount must be a positive integer');
  }
  if (purchasedRefund + bonusRefund === 0) {
    bonusRefund = expectedAmount;
  }
  if (purchasedRefund + bonusRefund !== expectedAmount) {
    throw badRequest('Refund split must equal refund amount');
  }

  profile.purchased_sparks += purchasedRefund;
  profile.bonus_sparks += bonusRefund;
  profile.sparks = profile.purchased_sparks + profile.bonus_sparks;
  return {
    balanceAfter: profile.sparks,
    purchasedRefund,
    bonusRefund,
    purchasedSparks: profile.purchased_sparks,
    bonusSparks: profile.bonus_sparks,
  };
}

async function spendSparksWithDatabase(client, userId, amount) {
  const cost = Number(amount || 0);
  if (!Number.isInteger(cost) || cost <= 0) {
    throw badRequest('Spark spend amount must be a positive integer');
  }

  const { rows } = await client.query(
    `SELECT sparks, purchased_sparks, bonus_sparks, bonus_sparks_expires_at
     FROM viewer_profiles
     WHERE user_id = $1
     FOR UPDATE`,
    [userId]
  );
  const profile = rows[0];
  if (!profile) {
    throw notFound('Spark balance not found');
  }
  reconcileSparkProfile(profile);

  if (profile.sparks < cost) {
    throw conflict('Insufficient sparks', {
      balance: profile.sparks,
      required: cost,
    });
  }

  const spend = spendSparksFromProfile(profile, cost);
  await client.query(
    `UPDATE viewer_profiles
     SET sparks = $1, purchased_sparks = $2, bonus_sparks = $3
     WHERE user_id = $4`,
    [spend.balanceAfter, spend.purchasedSparks, spend.bonusSparks, userId]
  );

  return spend;
}

async function refundSparksWithDatabase(
  client,
  userId,
  { purchasedSparks = 0, bonusSparks = 0, amount = null } = {}
) {
  const { rows } = await client.query(
    `SELECT sparks, purchased_sparks, bonus_sparks, bonus_sparks_expires_at
     FROM viewer_profiles
     WHERE user_id = $1
     FOR UPDATE`,
    [userId]
  );
  const profile = rows[0];
  if (!profile) {
    throw notFound('Spark balance not found');
  }

  const refund = refundSparksToProfile(profile, { purchasedSparks, bonusSparks, amount });
  await client.query(
    `UPDATE viewer_profiles
     SET sparks = $1, purchased_sparks = $2, bonus_sparks = $3
     WHERE user_id = $4`,
    [refund.balanceAfter, refund.purchasedSparks, refund.bonusSparks, userId]
  );
  return refund;
}

async function getSparkBalance(userId) {
  if (!hasDatabase()) {
    const state = getMemoryState();
    const profile = state.viewerProfiles.get(userId);
    if (!profile) {
      throw notFound('Spark balance not found');
    }
    return normalizeSparkBalance(profile);
  }

  const { rows } = await query(
    `SELECT sparks, purchased_sparks, bonus_sparks, bonus_sparks_expires_at, total_spent
     FROM viewer_profiles
     WHERE user_id = $1`,
    [userId]
  );
  if (!rows[0]) {
    throw notFound('Spark balance not found');
  }

  return normalizeSparkBalance(rows[0]);
}

async function listSparkTransactions(userId, { limit = 25 } = {}) {
  if (!hasDatabase()) {
    return getMemoryState()
      .sparkTransactions.filter((transaction) => transaction.user_id === userId)
      .slice(-limit)
      .reverse()
      .map(normalizeSparkTransaction);
  }

  const { rows } = await query(
    `SELECT id, user_id, type, amount, balance_after, source, bonus_spark,
      expires_at, expired_at, soft_deleted_at, reference_id, performer_id, metadata, created_at
     FROM spark_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows.map(normalizeSparkTransaction);
}

async function purchaseSparkPackage({ userId, packageId, paymentMethodId = null, processor = 'demo' }) {
  const sparkPackage = getSparkPackage(packageId);

  if (!hasDatabase()) {
    const state = getMemoryState();
    const profile = state.viewerProfiles.get(userId);
    if (!profile) {
      throw notFound('Spark balance not found');
    }
    reconcileSparkProfile(profile);

    const expiresAt = sparkPackage.bonusSparks > 0 ? bonusExpiryDate().toISOString() : null;
    profile.purchased_sparks += sparkPackage.purchasedSparks;
    profile.bonus_sparks += sparkPackage.bonusSparks;
    profile.sparks = profile.purchased_sparks + profile.bonus_sparks;
    profile.total_spent = numeric(profile.total_spent) + sparkPackage.priceUsd;
    if (expiresAt) profile.bonus_sparks_expires_at = expiresAt;

    const purchase = {
      id: cryptoRandomId(),
      user_id: userId,
      package_id: sparkPackage.id,
      purchased_sparks: sparkPackage.purchasedSparks,
      sparks_amount: sparkPackage.purchasedSparks,
      bonus_sparks: sparkPackage.bonusSparks,
      total_sparks: sparkPackage.totalSparks,
      usd_amount: sparkPackage.priceUsd,
      payment_processor: processor,
      payment_method_id: paymentMethodId,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    state.sparkPurchases.push(purchase);
    state.sparkTransactions.push({
      id: cryptoRandomId(),
      user_id: userId,
      type: 'purchase',
      amount: sparkPackage.purchasedSparks,
      balance_after: profile.sparks - sparkPackage.bonusSparks,
      source: 'purchase',
      bonus_spark: false,
      reference_id: purchase.id,
      performer_id: null,
      metadata: { package_id: sparkPackage.id, usd_amount: sparkPackage.priceUsd },
      created_at: purchase.created_at,
    });
    if (sparkPackage.bonusSparks > 0) {
      state.sparkTransactions.push({
        id: cryptoRandomId(),
        user_id: userId,
        type: 'sparkback',
        amount: sparkPackage.bonusSparks,
        balance_after: profile.sparks,
        source: 'purchase_bonus',
        bonus_spark: true,
        expires_at: expiresAt,
        reference_id: purchase.id,
        performer_id: null,
        metadata: { package_id: sparkPackage.id, expires_in_days: BONUS_SPARK_EXPIRY_DAYS },
        created_at: purchase.created_at,
      });
    }

    return {
      purchase,
      balance: normalizeSparkBalance(profile),
    };
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT sparks, purchased_sparks, bonus_sparks, total_spent
       FROM viewer_profiles
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );
    const profile = rows[0];
    if (!profile) {
      throw notFound('Spark balance not found');
    }
    reconcileSparkProfile(profile);

    const expiresAt = sparkPackage.bonusSparks > 0 ? bonusExpiryDate() : null;
    const purchasedSparks = profile.purchased_sparks + sparkPackage.purchasedSparks;
    const bonusSparks = profile.bonus_sparks + sparkPackage.bonusSparks;
    const balanceAfter = purchasedSparks + bonusSparks;
    const totalSpent = numeric(profile.total_spent) + sparkPackage.priceUsd;

    const purchaseResult = await client.query(
      `INSERT INTO spark_purchases (
        user_id, package_id, purchased_sparks, sparks_amount, bonus_sparks,
        usd_amount, payment_method_id, payment_processor, status, metadata
      )
      VALUES ($1, $2, $3, $3, $4, $5, $6, $7, 'completed', $8)
      RETURNING id, user_id, package_id, purchased_sparks, sparks_amount,
        bonus_sparks, total_sparks, usd_amount, status, created_at`,
      [
        userId,
        sparkPackage.id,
        sparkPackage.purchasedSparks,
        sparkPackage.bonusSparks,
        sparkPackage.priceUsd,
        paymentMethodId,
        processor,
        { closed_loop: true, no_cash_value: true },
      ]
    );
    const purchase = purchaseResult.rows[0];

    await client.query(
      `UPDATE viewer_profiles
       SET sparks = $1, purchased_sparks = $2, bonus_sparks = $3,
         bonus_sparks_expires_at = COALESCE($4, bonus_sparks_expires_at),
         total_spent = $5
       WHERE user_id = $6`,
      [balanceAfter, purchasedSparks, bonusSparks, expiresAt, totalSpent, userId]
    );

    await client.query(
      `INSERT INTO spark_transactions (
        user_id, type, amount, balance_after, source, bonus_spark,
        expires_at, reference_id, metadata
      )
      VALUES
        ($1, 'purchase', $2, $3, 'purchase', FALSE, NULL, $4, $5),
        ($1, 'sparkback', $6, $7, 'purchase_bonus', TRUE, $8, $4, $9)`,
      [
        userId,
        sparkPackage.purchasedSparks,
        balanceAfter - sparkPackage.bonusSparks,
        purchase.id,
        { package_id: sparkPackage.id, usd_amount: sparkPackage.priceUsd },
        sparkPackage.bonusSparks,
        balanceAfter,
        expiresAt,
        { package_id: sparkPackage.id, expires_in_days: BONUS_SPARK_EXPIRY_DAYS },
      ]
    );

    return {
      purchase,
      balance: normalizeSparkBalance({
        ...profile,
        sparks: balanceAfter,
        purchased_sparks: purchasedSparks,
        bonus_sparks: bonusSparks,
        total_spent: totalSpent,
        bonus_sparks_expires_at: expiresAt,
      }),
    };
  });
}

function listSparkPackages() {
  return SPARK_PACKAGES.map((item) => ({ ...item }));
}

function cryptoRandomId() {
  return require('crypto').randomUUID();
}

module.exports = {
  BONUS_SPARK_EXPIRY_DAYS,
  SPARK_PACKAGES,
  getSparkBalance,
  getSparkPackage,
  listSparkPackages,
  listSparkTransactions,
  normalizeSparkTransaction,
  purchaseSparkPackage,
  reconcileSparkProfile,
  refundSparksToProfile,
  refundSparksWithDatabase,
  spendSparksFromProfile,
  spendSparksWithDatabase,
};
