const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  addPaymentMethod,
  listPaymentMethods,
  listPaymentOptions,
} = require('../services/paymentService');

const router = express.Router();

router.get('/options', (req, res) => {
  res.status(200).json(listPaymentOptions());
});

router.get('/methods', requireAuth, async (req, res, next) => {
  try {
    res.status(200).json({ methods: await listPaymentMethods(req.user.sub) });
  } catch (error) {
    next(error);
  }
});

router.post('/methods', requireAuth, async (req, res, next) => {
  try {
    const method = await addPaymentMethod({
      userId: req.user.sub,
      type: req.body.type,
      provider: req.body.provider,
      providerRef: req.body.provider_ref || req.body.providerRef,
      label: req.body.label || null,
      lastFour: req.body.last_four || req.body.lastFour || null,
      chain: req.body.chain || null,
      walletAddress: req.body.wallet_address || req.body.walletAddress || null,
      isDefault: req.body.is_default ?? req.body.isDefault ?? false,
    });
    res.status(201).json({ method });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
