const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSparkBalance, listSparkTransactions } = require('../services/sparkLedgerService');
const { parseBoundedInt } = require('../utils/params');

const router = express.Router();

router.get('/balance', requireAuth, async (req, res, next) => {
  try {
    const balance = await getSparkBalance(req.user.sub);
    res.status(200).json(balance);
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', requireAuth, async (req, res, next) => {
  try {
    const limit = parseBoundedInt(req.query.limit, { defaultValue: 25, min: 1, max: 100 });
    const transactions = await listSparkTransactions(req.user.sub, {
      limit,
    });
    res.status(200).json({ transactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
