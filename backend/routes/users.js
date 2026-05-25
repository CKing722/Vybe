const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getCurrentViewer } = require('../services/profileService');
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

module.exports = router;
