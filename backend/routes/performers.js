const express = require('express');
const { getPerformer, listPerformers } = require('../services/performerService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const performers = await listPerformers({
      category: req.query.category,
      live: req.query.live,
      query: req.query.q || req.query.query || req.query.search,
      sort: req.query.sort,
    });
    res.status(200).json({ performers });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const performer = await getPerformer(req.params.id);
    res.status(200).json({ performer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
