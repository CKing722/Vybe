const express = require('express');
const { env } = require('../config/env');
const { hasDatabase } = require('../config/db');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'vybe-backend',
    environment: env.nodeEnv,
    persistence: hasDatabase() ? 'postgresql' : 'memory',
    paidProvidersEnabled: {
      anthropic: env.enablePaidAi,
    },
  });
});

module.exports = router;
