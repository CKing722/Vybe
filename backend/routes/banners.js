const express = require('express');
const { listActiveBanners } = require('../services/bannerService');
const { parseBoundedInt } = require('../utils/params');

const router = express.Router();

router.get('/active', async (req, res, next) => {
  try {
    const limit = parseBoundedInt(req.query.limit, { defaultValue: 10, min: 1, max: 50 });
    const banners = await listActiveBanners({ limit });
    res.status(200).json({ banners });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
