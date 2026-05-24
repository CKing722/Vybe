const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getCurrentViewer } = require('../services/profileService');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getCurrentViewer(req.user.sub);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
