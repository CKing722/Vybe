const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getSparkBalance, listSparkTransactions } = require('../services/sparkLedgerService');

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
    const transactions = await listSparkTransactions(req.user.sub, {
      limit: Math.min(100, Number(req.query.limit || 25)),
    });
    res.status(200).json({ transactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
