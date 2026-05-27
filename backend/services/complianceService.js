const { hasDatabase, query, withTransaction } = require('../config/db');
const { badRequest, notFound } = require('../utils/errors');
const { getMemoryState, randomId } = require('./memoryStore');

function normalizeBool(value) {
  return value === true || value === 'true';
}

function activeGeoBlockFor(region, blocks = []) {
  if (!region?.countryCode) return null;
  const country = String(region.countryCode).toUpperCase();
  const regionCode = region.regionCode ? String(region.regionCode).toUpperCase() : null;
  return blocks.find((block) => {
    if (!block.is_active && !block.isActive) return false;
    if (String(block.country_code || block.countryCode).toUpperCase() !== country) return false;
    const blockedRegion = block.region_code || block.regionCode || null;
    return !blockedRegion || String(blockedRegion).toUpperCase() === regionCode;
  }) || null;
}

async function getAdultAccessStatus({ userId, countryCode, regionCode } = {}) {
  if (!userId) throw badRequest('userId is required');

  if (!hasDatabase()) {
    const state = getMemoryState();
    const user = state.users.get(userId);
    if (!user) throw notFound('User not found');
    const geoBlock = activeGeoBlockFor({ countryCode, regionCode }, state.geoBlocks || []);
    const ageVerified = normalizeBool(user.age_verified || user.is_verified);
    return {
      ageVerified,
      geoBlocked: Boolean(geoBlock),
      adultContentAllowed: ageVerified && !geoBlock,
      requiresVerification: !ageVerified,
      reason: geoBlock ? geoBlock.reason : null,
      verificationProvider: user.age_verification_provider || null,
      verifiedAt: user.age_verification_date || null,
    };
  }

  const userResult = await query(
    `SELECT id, age_verified, is_verified, age_verification_provider, age_verification_date
     FROM users
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) throw notFound('User not found');

  const blockResult = await query(
    `SELECT id, reason
     FROM geo_blocks
     WHERE is_active = TRUE
       AND country_code = $1
       AND (region_code IS NULL OR region_code = $2)
       AND (ends_at IS NULL OR ends_at > NOW())
     ORDER BY region_code NULLS LAST, created_at DESC
     LIMIT 1`,
    [countryCode ? String(countryCode).toUpperCase() : null, regionCode ? String(regionCode).toUpperCase() : null]
  );
  const geoBlock = blockResult.rows[0] || null;
  const ageVerified = normalizeBool(user.age_verified || user.is_verified);
  return {
    ageVerified,
    geoBlocked: Boolean(geoBlock),
    adultContentAllowed: ageVerified && !geoBlock,
    requiresVerification: !ageVerified,
    reason: geoBlock ? geoBlock.reason : null,
    verificationProvider: user.age_verification_provider || null,
    verifiedAt: user.age_verification_date || null,
  };
}

async function recordAgeVerification({
  userId,
  provider = 'manual',
  providerRef,
  status = 'verified',
  metadata = {},
}) {
  if (!userId) throw badRequest('userId is required');
  if (!providerRef) throw badRequest('providerRef is required');
  if (!['pending', 'verified', 'failed', 'expired'].includes(status)) {
    throw badRequest('Invalid age verification status');
  }

  if (!hasDatabase()) {
    const state = getMemoryState();
    const user = state.users.get(userId);
    if (!user) throw notFound('User not found');
    const now = new Date().toISOString();
    const event = {
      id: randomId(),
      user_id: userId,
      provider,
      provider_ref: providerRef,
      status,
      checked_at: now,
      metadata,
    };
    if (status === 'verified') {
      user.age_verified = true;
      user.is_verified = true;
      user.age_verification_provider = provider;
      user.age_verification_token = providerRef;
      user.age_verification_date = now;
    }
    state.complianceEvents.push({
      id: randomId(),
      actor_id: userId,
      event_type: 'age_verification_recorded',
      subject_type: 'user',
      subject_id: userId,
      metadata: event,
      created_at: now,
    });
    return {
      verification: event,
      access: await getAdultAccessStatus({ userId }),
    };
  }

  const verification = await withTransaction(async (client) => {
    const nowResult = await client.query('SELECT NOW() AS now');
    const checkedAt = nowResult.rows[0].now;
    const result = await client.query(
      `INSERT INTO age_verifications (user_id, provider, provider_ref, status, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, provider, provider_ref, status, checked_at, expires_at, metadata`,
      [userId, provider, providerRef, status, metadata]
    );

    if (status === 'verified') {
      await client.query(
        `UPDATE users
         SET age_verified = TRUE,
           is_verified = CASE WHEN role = 'viewer' THEN TRUE ELSE is_verified END,
           age_verification_provider = $2,
           age_verification_token = $3,
           age_verification_date = $4
         WHERE id = $1`,
        [userId, provider, providerRef, checkedAt]
      );
    }

    await client.query(
      `INSERT INTO compliance_audit_events (actor_id, event_type, subject_type, subject_id, metadata)
       VALUES ($1, 'age_verification_recorded', 'user', $1, $2)`,
      [userId, { provider, status }]
    );

    return result.rows[0];
  });
  return {
    verification,
    access: await getAdultAccessStatus({ userId }),
  };
}

async function recordPerformerVerification({
  performerId,
  provider = 'manual',
  providerRef,
  status = 'verified',
  legalName,
  stageNames = [],
  dateOfBirth = null,
  metadata = {},
}) {
  if (!performerId) throw badRequest('performerId is required');
  if (!providerRef) throw badRequest('providerRef is required');
  if (!['pending', 'verified', 'rejected', 'expired'].includes(status)) {
    throw badRequest('Invalid performer verification status');
  }

  if (!hasDatabase()) {
    const state = getMemoryState();
    const profile = state.performerProfiles.get(performerId);
    if (!profile) throw notFound('Performer profile not found');
    const now = new Date().toISOString();
    Object.assign(profile, {
      legal_name: legalName || profile.legal_name || profile.stage_name,
      stage_names: stageNames.length ? stageNames : profile.stage_names || [profile.stage_name],
      date_of_birth: dateOfBirth || profile.date_of_birth || null,
      verification_status: status,
      verification_date: status === 'verified' ? now : profile.verification_date || null,
      verification_ref: providerRef,
      verification_provider: provider,
      id_verified: status === 'verified',
      can_receive_bookings: status === 'verified',
    });
    return { performerId, verificationStatus: profile.verification_status };
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO performer_verifications (
        performer_id, provider, provider_ref, status, legal_name, stage_names,
        date_of_birth, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, performer_id, provider, status, checked_at`,
      [performerId, provider, providerRef, status, legalName, JSON.stringify(stageNames), dateOfBirth, metadata]
    );

    await client.query(
      `UPDATE performer_profiles
       SET legal_name = COALESCE($2, legal_name),
         stage_names = CASE WHEN $3::jsonb = '[]'::jsonb THEN stage_names ELSE $3::jsonb END,
         date_of_birth = COALESCE($4, date_of_birth),
         verification_status = $5,
         verification_date = CASE WHEN $5 = 'verified' THEN NOW() ELSE verification_date END,
         verification_ref = $6,
         verification_provider = $7,
         id_verified = ($5 = 'verified'),
         can_receive_bookings = ($5 = 'verified')
       WHERE user_id = $1`,
      [performerId, legalName, JSON.stringify(stageNames), dateOfBirth, status, providerRef, provider]
    );

    await client.query(
      `INSERT INTO compliance_audit_events (actor_id, event_type, subject_type, subject_id, metadata)
       VALUES ($1, 'performer_2257_verification_recorded', 'performer', $1, $2)`,
      [performerId, { provider, status }]
    );

    return {
      performerId,
      verification: result.rows[0],
    };
  });
}

async function getComplianceOverview() {
  if (!hasDatabase()) {
    const state = getMemoryState();
    const users = Array.from(state.users.values());
    const performerProfiles = Array.from(state.performerProfiles.values());
    return {
      viewers: {
        total: users.filter((user) => user.role === 'viewer').length,
        ageVerified: users.filter((user) => user.role === 'viewer' && (user.age_verified || user.is_verified)).length,
      },
      performers: {
        total: users.filter((user) => user.role === 'performer').length,
        verified2257: performerProfiles.filter((profile) => profile.verification_status === 'verified' || profile.id_verified).length,
        blockedFromLive: performerProfiles.filter((profile) => profile.verification_status !== 'verified' && !profile.id_verified).length,
      },
      moderation: { open: 0, critical: 0 },
      dmca: { open: 0 },
      closedLoopSparkEconomy: true,
    };
  }

  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE role = 'viewer')::int AS total_viewers,
       COUNT(*) FILTER (WHERE role = 'viewer' AND age_verified = TRUE)::int AS age_verified_viewers,
       COUNT(*) FILTER (WHERE role = 'performer')::int AS total_performers,
       (
        SELECT COUNT(*)::int FROM performer_profiles
        WHERE verification_status = 'verified'
       ) AS verified_performers,
       (
        SELECT COUNT(*)::int FROM performer_profiles
        WHERE verification_status <> 'verified'
       ) AS blocked_performers,
       (
        SELECT COUNT(*)::int FROM moderation_queue
        WHERE status IN ('open', 'reviewing')
       ) AS open_moderation,
       (
        SELECT COUNT(*)::int FROM moderation_queue
        WHERE status IN ('open', 'reviewing') AND severity = 'critical'
       ) AS critical_moderation,
       (
        SELECT COUNT(*)::int FROM dmca_requests
        WHERE status IN ('received', 'reviewing', 'counter_notice')
       ) AS open_dmca
     FROM users`
  );
  const row = rows[0];
  return {
    viewers: { total: row.total_viewers, ageVerified: row.age_verified_viewers },
    performers: {
      total: row.total_performers,
      verified2257: row.verified_performers,
      blockedFromLive: row.blocked_performers,
    },
    moderation: { open: row.open_moderation, critical: row.critical_moderation },
    dmca: { open: row.open_dmca },
    closedLoopSparkEconomy: true,
  };
}

module.exports = {
  getAdultAccessStatus,
  getComplianceOverview,
  recordAgeVerification,
  recordPerformerVerification,
};
