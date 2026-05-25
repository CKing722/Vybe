const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const { hasDatabase, withTransaction, query } = require('../config/db');
const { env } = require('../config/env');
const { badRequest, conflict, unauthorized } = require('../utils/errors');
const { getMemoryState, randomId } = require('./memoryStore');

authenticator.options = { ...authenticator.options, window: 1 };

const PUBLIC_USER_COLUMNS =
  'id, email, display_name, role, avatar_url, banner_url, bio, is_verified, is_active, two_factor_enabled, created_at';

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    role: user.role,
    avatar_url: user.avatar_url || null,
    banner_url: user.banner_url || null,
    bio: user.bio || null,
    is_verified: Boolean(user.is_verified),
    is_active: Boolean(user.is_active),
    two_factor_enabled: Boolean(user.two_factor_enabled),
    created_at: user.created_at,
  };
}

function validateRole(role) {
  if (!['viewer', 'performer'].includes(role)) {
    throw badRequest('role must be viewer or performer');
  }
}

async function registerUser({ email, password, displayName, role = 'viewer' }) {
  if (!email || !password || !displayName) {
    throw badRequest('email, password, and displayName are required');
  }
  validateRole(role);

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  if (!hasDatabase()) {
    return registerMemoryUser({ email, passwordHash, displayName, role });
  }

  return withTransaction(async (client) => {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      throw conflict('Email is already registered');
    }

    const result = await client.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_USER_COLUMNS}`,
      [email, passwordHash, displayName, role]
    );
    const user = result.rows[0];

    if (role === 'viewer') {
      await client.query('INSERT INTO viewer_profiles (user_id) VALUES ($1)', [user.id]);
    } else {
      await client.query('INSERT INTO performer_profiles (user_id, stage_name) VALUES ($1, $2)', [
        user.id,
        displayName,
      ]);
      await client.query('INSERT INTO performer_capabilities (performer_id) VALUES ($1)', [user.id]);
    }

    return publicUser(user);
  });
}

function registerMemoryUser({ email, passwordHash, displayName, role }) {
  const state = getMemoryState();
  const normalizedEmail = email.toLowerCase();
  const exists = Array.from(state.users.values()).some(
    (user) => user.email.toLowerCase() === normalizedEmail
  );
  if (exists) {
    throw conflict('Email is already registered');
  }

  const id = randomId();
  const now = new Date().toISOString();
  const user = {
    id,
    email: normalizedEmail,
    password_hash: passwordHash,
    display_name: displayName,
    role,
    is_verified: false,
    is_active: true,
    two_factor_enabled: false,
    two_factor_secret: null,
    created_at: now,
  };
  state.users.set(id, user);

  if (role === 'viewer') {
    state.viewerProfiles.set(id, {
      user_id: id,
      sparks: 0,
      total_spent: 0,
      games_played: 0,
      games_won: 0,
      sparks_earned: 0,
      total_sessions: 0,
    });
  } else {
    state.performerProfiles.set(id, {
      user_id: id,
      stage_name: displayName,
      is_live: false,
      accent_color: '#ff2d78',
    });
  }

  return publicUser(user);
}

async function loginUser(body = {}) {
  const { email, password } = body;
  if (!email || !password) {
    throw badRequest('email and password are required');
  }

  if (!hasDatabase()) {
    return loginMemoryUser({ email, password, twoFactorToken: extractTwoFactorToken(body) });
  }

  const result = await query(
    `SELECT ${PUBLIC_USER_COLUMNS}, password_hash
            , two_factor_secret
     FROM users
     WHERE email = $1 AND is_active = TRUE`,
    [email]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw unauthorized('Invalid email or password');
  }

  if (user.two_factor_enabled) {
    const twoFactorToken = extractTwoFactorToken(body);
    if (!twoFactorToken) {
      throw unauthorized('Two-factor token required');
    }
    if (!user.two_factor_secret || !authenticator.check(twoFactorToken, user.two_factor_secret)) {
      throw unauthorized('Invalid two-factor token');
    }
  }

  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  return publicUser(user);
}

function extractTwoFactorToken(body = {}) {
  const candidate =
    body.twoFactorToken ||
    body.two_factor_token ||
    body.totp ||
    body.otp ||
    body.two_factor_code ||
    body.twoFactorCode;
  if (!candidate) return null;
  const token = String(candidate).replace(/\s+/g, '');
  if (!/^\d{6,8}$/.test(token)) {
    throw badRequest('twoFactorToken must be a 6-8 digit code');
  }
  return token;
}

async function loginMemoryUser({ email, password, twoFactorToken }) {
  const normalizedEmail = email.toLowerCase();
  const user = Array.from(getMemoryState().users.values()).find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail && candidate.is_active
  );
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    throw unauthorized('Invalid email or password');
  }
  if (user.two_factor_enabled) {
    if (!twoFactorToken) {
      throw unauthorized('Two-factor token required');
    }
    if (!user.two_factor_secret || !authenticator.check(twoFactorToken, user.two_factor_secret)) {
      throw unauthorized('Invalid two-factor token');
    }
  }
  return publicUser(user);
}

async function findUserForTwoFactor(userId) {
  if (!userId) {
    throw badRequest('userId is required');
  }

  if (!hasDatabase()) {
    const user = getMemoryState().users.get(userId);
    if (!user) {
      throw unauthorized('User not found');
    }
    return user;
  }

  const result = await query(
    'SELECT id, email, two_factor_enabled, two_factor_secret FROM users WHERE id = $1 AND is_active = TRUE',
    [userId]
  );
  const user = result.rows[0];
  if (!user) {
    throw unauthorized('User not found');
  }
  return user;
}

async function startTwoFactorSetup({ userId, issuer = 'VYBE' } = {}) {
  const user = await findUserForTwoFactor(userId);
  if (user.two_factor_enabled) {
    throw badRequest('Two-factor authentication is already enabled');
  }

  const secret = authenticator.generateSecret();
  const label = user.email || user.id;
  const otpauthUrl = authenticator.keyuri(label, issuer, secret);

  if (!hasDatabase()) {
    user.two_factor_secret = secret;
    user.two_factor_enabled = false;
  } else {
    await query(
      'UPDATE users SET two_factor_secret = $1, two_factor_enabled = FALSE WHERE id = $2',
      [secret, user.id]
    );
  }

  return {
    issuer,
    label,
    otpauthUrl,
    secret,
  };
}

async function verifyTwoFactorSetup({ userId, token } = {}) {
  const cleanToken = extractTwoFactorToken({ twoFactorToken: token });
  const user = await findUserForTwoFactor(userId);
  if (!user.two_factor_secret) {
    throw badRequest('Two-factor setup has not been started');
  }

  if (!authenticator.check(cleanToken, user.two_factor_secret)) {
    throw unauthorized('Invalid two-factor token');
  }

  if (!hasDatabase()) {
    user.two_factor_enabled = true;
  } else {
    await query('UPDATE users SET two_factor_enabled = TRUE WHERE id = $1', [user.id]);
  }

  return { twoFactorEnabled: true };
}

module.exports = {
  loginUser,
  extractTwoFactorToken,
  startTwoFactorSetup,
  verifyTwoFactorSetup,
  publicUser,
  registerUser,
};
