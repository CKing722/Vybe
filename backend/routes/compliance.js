const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAdultAccessStatus,
  getComplianceOverview,
  recordAgeVerification,
  recordPerformerVerification,
} = require('../services/complianceService');

const router = express.Router();

router.get('/adult-access', requireAuth, async (req, res, next) => {
  try {
    const access = await getAdultAccessStatus({
      userId: req.user.sub,
      countryCode: req.query.country_code || req.query.countryCode,
      regionCode: req.query.region_code || req.query.regionCode,
    });
    res.status(200).json(access);
  } catch (error) {
    next(error);
  }
});

router.post('/age-verification', requireAuth, async (req, res, next) => {
  try {
    const result = await recordAgeVerification({
      userId: req.user.sub,
      provider: req.body.provider || 'manual',
      providerRef: req.body.provider_ref || req.body.providerRef || req.body.token,
      status: req.body.status || 'verified',
      metadata: req.body.metadata || {},
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/performer-verification', requireAuth, requireRole('performer', 'admin'), async (req, res, next) => {
  try {
    const performerId = req.user.role === 'admin'
      ? req.body.performer_id || req.body.performerId
      : req.user.sub;
    const result = await recordPerformerVerification({
      performerId,
      provider: req.body.provider || 'manual',
      providerRef: req.body.provider_ref || req.body.providerRef,
      status: req.body.status || 'verified',
      legalName: req.body.legal_name || req.body.legalName,
      stageNames: req.body.stage_names || req.body.stageNames || [],
      dateOfBirth: req.body.date_of_birth || req.body.dateOfBirth || null,
      metadata: req.body.metadata || {},
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/overview', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    res.status(200).json(await getComplianceOverview());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
