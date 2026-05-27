const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getCurrentViewer,
  updateCurrentViewer,
  updateViewerPassword,
} = require('../services/profileService');
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

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await updateCurrentViewer(req.user.sub, req.body);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/me/password', requireAuth, async (req, res, next) => {
  try {
    const result = await updateViewerPassword({
      userId: req.user.sub,
      currentPassword: req.body.current_password || req.body.currentPassword,
      newPassword: req.body.new_password || req.body.newPassword,
    });
    res.status(200).json(result);
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
