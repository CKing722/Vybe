const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getSparkBalance,
  listSparkPackages,
  listSparkTransactions,
  purchaseSparkPackage,
} = require('../services/sparkLedgerService');

const router = express.Router();

router.get('/packages', async (req, res) => {
  res.status(200).json({
    packages: listSparkPackages(),
    rules: {
      closedLoop: true,
      cashOutAllowed: false,
      transferAllowed: false,
      bonusExpiryDays: 90,
    },
  });
});

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

router.post('/purchase', requireAuth, async (req, res, next) => {
  try {
    const result = await purchaseSparkPackage({
      userId: req.user.sub,
      packageId: req.body.package_id || req.body.packageId,
      paymentMethodId: req.body.payment_method_id || req.body.paymentMethodId || null,
      processor: req.body.processor || 'demo',
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
