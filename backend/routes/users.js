const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { getCurrentViewer, updateViewerProfile } = require('../services/profileService');
const { getViewerPerformerHistory } = require('../services/viewerHistoryService');

const router = express.Router();

const updateProfileValidation = validate([
  body().custom((_, { req }) => {
    const hasAny =
      req.body.display_name !== undefined ||
      req.body.displayName !== undefined ||
      req.body.avatar_url !== undefined ||
      req.body.avatarUrl !== undefined ||
      req.body.avatar !== undefined ||
      req.body.banner_url !== undefined ||
      req.body.bannerUrl !== undefined ||
      req.body.banner !== undefined ||
      req.body.bio !== undefined;

    if (!hasAny) {
      throw new Error('At least one profile field must be provided');
    }
    return true;
  }),
  body('display_name')
    .customSanitizer((value, { req }) => value ?? req.body.displayName)
    .optional()
    .isString()
    .withMessage('display_name must be a string')
    .trim()
    .isLength({ min: 2, max: 32 })
    .withMessage('display_name must be 2-32 characters'),
  body('avatar_url')
    .customSanitizer((value, { req }) => value ?? req.body.avatarUrl ?? req.body.avatar)
    .optional({ values: 'undefined' })
    .custom((value) => value === null || typeof value === 'string')
    .withMessage('avatar_url must be a string or null')
    .if((value) => value !== null)
    .trim()
    .isLength({ max: 2048 })
    .withMessage('avatar_url must be at most 2048 characters'),
  body('banner_url')
    .customSanitizer((value, { req }) => value ?? req.body.bannerUrl ?? req.body.banner)
    .optional({ values: 'undefined' })
    .custom((value) => value === null || typeof value === 'string')
    .withMessage('banner_url must be a string or null')
    .if((value) => value !== null)
    .trim()
    .isLength({ max: 2048 })
    .withMessage('banner_url must be at most 2048 characters'),
  body('bio')
    .optional({ values: 'undefined' })
    .custom((value) => value === null || typeof value === 'string')
    .withMessage('bio must be a string or null')
    .if((value) => value !== null)
    .trim()
    .isLength({ max: 280 })
    .withMessage('bio must be at most 280 characters'),
]);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getCurrentViewer(req.user.sub);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/me/profile', requireAuth, updateProfileValidation, async (req, res, next) => {
  try {
    const updatedProfile = await updateViewerProfile(req.user.sub, {
      displayName: req.body.display_name ?? req.body.displayName,
      avatarUrl: req.body.avatar_url ?? req.body.avatarUrl ?? req.body.avatar,
      bannerUrl: req.body.banner_url ?? req.body.bannerUrl ?? req.body.banner,
      bio: req.body.bio,
    });
    res.status(200).json(updatedProfile);
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
