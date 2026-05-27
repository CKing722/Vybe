const crypto = require('crypto');
const { hasDatabase, query } = require('../config/db');
const { badRequest } = require('../utils/errors');
const { getMemoryState, randomId } = require('./memoryStore');

const PAYMENT_RAILS = [
  {
    type: 'card',
    label: 'Credit / Debit Card',
    providers: ['ccbill', 'segpay', 'epoch'],
    storesRawPaymentData: false,
  },
  {
    type: 'wallet',
    label: 'Apple Pay / Google Pay',
    providers: ['adult_processor_wallet_token'],
    storesRawPaymentData: false,
  },
  {
    type: 'bank',
    label: 'Bank Transfer',
    providers: ['adult_processor_ach'],
    storesRawPaymentData: false,
  },
  {
    type: 'crypto_wallet',
    label: 'Cryptocurrency',
    providers: ['coinbase_commerce', 'bitpay', 'nowpayments'],
    supportedNetworks: [
      'bitcoin',
      'ethereum',
      'base',
      'polygon',
      'arbitrum',
      'optimism',
      'solana',
      'tron',
      'bnb_chain',
      'avalanche',
    ],
    storesRawPaymentData: false,
    custody: 'processor_hosted_checkout',
  },
];

function hashWalletAddress(address) {
  if (!address) return null;
  return crypto.createHash('sha256').update(String(address).trim().toLowerCase()).digest('hex');
}

function normalizeMethod(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    provider: row.provider,
    label: row.label || null,
    lastFour: row.last_four || null,
    chain: row.chain || null,
    isDefault: Boolean(row.is_default),
    status: row.status || 'active',
    createdAt: row.created_at,
  };
}

function listPaymentOptions() {
  return {
    rails: PAYMENT_RAILS,
    policy: {
      rawCardDataStored: false,
      rawWalletAddressesStored: false,
      sparksClosedLoop: true,
      cashOutForViewers: false,
      processorHostedCheckoutRequired: true,
    },
  };
}

async function listPaymentMethods(userId) {
  if (!hasDatabase()) {
    const state = getMemoryState();
    return Array.from(state.paymentMethods.values())
      .filter((method) => method.user_id === userId)
      .map(normalizeMethod);
  }

  const { rows } = await query(
    `SELECT id, user_id, type, provider, label, last_four, chain, is_default, status, created_at
     FROM payment_methods
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows.map(normalizeMethod);
}

async function addPaymentMethod({
  userId,
  type,
  provider,
  providerRef,
  label = null,
  lastFour = null,
  chain = null,
  walletAddress = null,
  isDefault = false,
}) {
  if (!userId) throw badRequest('userId is required');
  if (!type || !provider || !providerRef) {
    throw badRequest('type, provider, and providerRef are required');
  }
  if (!['card', 'bank', 'apple_pay', 'google_pay', 'crypto_wallet', 'voucher'].includes(type)) {
    throw badRequest('Unsupported payment method type');
  }

  if (!hasDatabase()) {
    const state = getMemoryState();
    if (isDefault) {
      for (const method of state.paymentMethods.values()) {
        if (method.user_id === userId) method.is_default = false;
      }
    }
    const method = {
      id: randomId(),
      user_id: userId,
      type,
      provider,
      provider_ref: providerRef,
      label,
      last_four: lastFour,
      chain,
      wallet_address_hash: hashWalletAddress(walletAddress),
      is_default: Boolean(isDefault),
      status: 'active',
      created_at: new Date().toISOString(),
    };
    state.paymentMethods.set(method.id, method);
    return normalizeMethod(method);
  }

  if (isDefault) {
    await query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [userId]);
  }
  const { rows } = await query(
    `INSERT INTO payment_methods (
      user_id, type, provider, provider_ref, label, last_four, chain,
      wallet_address_hash, is_default
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, user_id, type, provider, label, last_four, chain, is_default, status, created_at`,
    [
      userId,
      type,
      provider,
      providerRef,
      label,
      lastFour,
      chain,
      hashWalletAddress(walletAddress),
      Boolean(isDefault),
    ]
  );
  return normalizeMethod(rows[0]);
}

module.exports = {
  addPaymentMethod,
  listPaymentMethods,
  listPaymentOptions,
};
