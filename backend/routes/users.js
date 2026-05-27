const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { getCurrentViewer, updateViewerProfile } = require('../services/profileService');
const { getViewerPerformerHistory } = require('../services/viewerHistoryService');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getCurrentViewer(req.user.sub);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

router.get('/me/history/:performerId', requireAuth, async (req, res, next) => {
  try {
    const history = await getViewerPerformerHistory(req.user.sub, req.params.performerId, {
      limit: req.query.limit,
    });
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

const profileUpdateValidation = validate([
  body('display_name')
    .customSanitizer((value, { req }) => value ?? req.body.displayName)
    .optional({ nullable: true })
    .isString()
    .withMessage('display_name must be a string')
    .customSanitizer((value) => (typeof value === 'string' ? value.trim() : value))
    .isLength({ min: 1, max: 50 })
    .withMessage('display_name must be between 1 and 50 characters'),
  body('avatar')
    .customSanitizer((value, { req }) => value ?? req.body.avatar_url ?? req.body.avatarUrl)
    .optional({ nullable: true })
    .isString()
    .withMessage('avatar must be a string')
    .customSanitizer((value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .isLength({ max: 2048 })
    .withMessage('avatar must be at most 2048 characters')
    .custom((value) => value === null || /^https?:\/\//i.test(value))
    .withMessage('avatar must be an http(s) URL'),
  body('bio')
    .optional({ nullable: true })
    .custom((value) => value === null || typeof value === 'string')
    .withMessage('bio must be a string')
    .customSanitizer((value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .isLength({ max: 2000 })
    .withMessage('bio must be at most 2000 characters'),
]);

router.put('/me/profile', requireAuth, requireRole('viewer'), profileUpdateValidation, async (req, res, next) => {
  try {
    const profile = await updateViewerProfile(req.user.sub, {
      displayName: req.body.display_name,
      avatarUrl: req.body.avatar,
      bio: req.body.bio,
    });

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
