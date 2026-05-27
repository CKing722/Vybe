const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  acceptRequest,
  createRequestPurchase,
  declineRequest,
  listPerformerRequestMenu,
  listPerformerRequests,
  listViewerRequests,
} = require('../services/requestService');

const router = express.Router();

router.get('/performers/:performerId/menu', async (req, res, next) => {
  try {
    const requests = await listPerformerRequestMenu(req.params.performerId);
    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
});

router.post('/purchase', requireAuth, requireRole('viewer'), async (req, res, next) => {
  try {
    const result = await createRequestPurchase({
      viewerId: req.user.sub,
      performerId: req.body.performer_id || req.body.performerId,
      requestId: req.body.request_id || req.body.requestId,
      prompt: req.body.prompt || null,
    });
    const io = req.app.get('io');
    if (io) {
      io.to(result.request.performerId).emit('performer_request_pending', result.request);
    }
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, requireRole('viewer'), async (req, res, next) => {
  try {
    const requests = await listViewerRequests(req.user.sub, {
      limit: Math.min(100, Number(req.query.limit || 25)),
    });
    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
});

router.get('/performer', requireAuth, requireRole('performer', 'admin'), async (req, res, next) => {
  try {
    const performerId = req.user.role === 'admin'
      ? req.query.performer_id || req.query.performerId || req.user.sub
      : req.user.sub;
    const requests = await listPerformerRequests(performerId, {
      status: req.query.status || 'pending',
      limit: Math.min(100, Number(req.query.limit || 50)),
    });
    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/accept', requireAuth, requireRole('performer', 'admin'), async (req, res, next) => {
  try {
    const performerId = req.user.role === 'admin'
      ? req.body.performer_id || req.body.performerId
      : req.user.sub;
    const result = await acceptRequest({
      performerId,
      requestPurchaseId: req.params.id,
    });
    const io = req.app.get('io');
    if (io) {
      io.to(result.request.performerId).emit('request_accepted', result.publicEvent);
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/decline', requireAuth, requireRole('performer', 'admin'), async (req, res, next) => {
  try {
    const performerId = req.user.role === 'admin'
      ? req.body.performer_id || req.body.performerId
      : req.user.sub;
    const result = await declineRequest({
      performerId,
      requestPurchaseId: req.params.id,
      reason: req.body.reason || null,
    });
    const io = req.app.get('io');
    if (io) {
      io.to(result.request.performerId).emit('request_declined_refunded', result.publicEvent);
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
