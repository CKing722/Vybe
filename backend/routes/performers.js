const express = require('express');
const { getPerformer, listPerformers } = require('../services/performerService');
const { listPerformerFeed } = require('../services/performerFeedService');
const { listPerformerRequests } = require('../services/performerRequestService');

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

router.get('/:id/feed', async (req, res, next) => {
  try {
    const performer = await getPerformer(req.params.id);
    const feed = await listPerformerFeed(performer, {
      limit: req.query.limit,
    });
    res.status(200).json({ feed });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/requests', async (req, res, next) => {
  try {
    const performer = await getPerformer(req.params.id);
    const requests = await listPerformerRequests(performer);
    res.status(200).json({ requests });
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
