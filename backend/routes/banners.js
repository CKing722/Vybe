const express = require('express');
const { listActiveBanners } = require('../services/bannerService');

const router = express.Router();

router.get('/active', async (req, res, next) => {
  try {
    const banners = await listActiveBanners({ limit: Number(req.query.limit || 10) });
    res.status(200).json({ banners });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
