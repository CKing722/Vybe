const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listGiftTypes } = require('../services/giftCatalog');
const { sendGift } = require('../services/sparkEngine');
const { recordGiftForStorm } = require('../services/stormService');

const router = express.Router();

function emitGiftEvents(io, result) {
  if (!io) return;

  const roomId = result.giftSent.roomId;
  io.to(roomId).emit('gift_animation', result.animation);

  if (result.banner) {
    io.emit('platform_banner', result.banner);
  }

  const stormEvents = recordGiftForStorm({
    roomId,
    performerId: result.giftSent.performerId,
    senderId: result.giftSent.senderId,
    sparkCost: result.giftSent.sparkCost,
  });
  for (const event of stormEvents) {
    io.to(roomId).emit(event.type, event.payload);
  }
}

router.get('/types', async (req, res, next) => {
  try {
    const gifts = await listGiftTypes();
    res.status(200).json({ gifts });
  } catch (error) {
    next(error);
  }
});

router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const result = await sendGift({
      senderId: req.user.sub,
      performerId: req.body.performer_id || req.body.performerId,
      giftTypeId: req.body.gift_type_id || req.body.giftTypeId,
      roomId: req.body.room_id || req.body.roomId,
    });

    emitGiftEvents(req.app.get('io'), result);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { emitGiftEvents, router };
