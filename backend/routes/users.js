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

const updateProfileValidation = validate([
  body('display_name')
    .customSanitizer((value, { req }) => value ?? req.body.displayName ?? req.body.name)
    .optional({ nullable: true })
    .isString()
    .withMessage('display_name must be a string')
    .trim()
    .isLength({ min: 2, max: 32 })
    .withMessage('display_name must be 2-32 characters'),
  body('avatar_url')
    .customSanitizer((value, { req }) => value ?? req.body.avatarUrl ?? req.body.avatar)
    .customSanitizer((value) => (value === '' ? null : value))
    .optional({ nullable: true })
    .isString()
    .withMessage('avatar_url must be a string')
    .trim()
    .isLength({ max: 2048 })
    .withMessage('avatar_url must be at most 2048 characters')
    .if((value) => value != null)
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('avatar_url must be a valid http(s) URL'),
  body('bio')
    .customSanitizer((value) => (value === '' ? null : value))
    .optional({ nullable: true })
    .isString()
    .withMessage('bio must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('bio must be at most 500 characters'),
]);

router.put('/me/profile', requireAuth, requireRole('viewer'), updateProfileValidation, async (req, res, next) => {
  try {
    const profile = await updateViewerProfile(req.user.sub, {
      display_name: req.body.display_name,
      avatar_url: req.body.avatar_url,
      bio: req.body.bio,
    });
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

module.exports = router;
