const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
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

const sendValidation = validate([
  body('performer_id')
    .customSanitizer((value, { req }) => value ?? req.body.performerId)
    .isString()
    .withMessage('performer_id must be a string')
    .trim()
    .notEmpty()
    .withMessage('performer_id is required'),
  body('gift_type_id')
    .customSanitizer((value, { req }) => value ?? req.body.giftTypeId)
    .isString()
    .withMessage('gift_type_id must be a string')
    .trim()
    .notEmpty()
    .withMessage('gift_type_id is required'),
  body('room_id')
    .customSanitizer((value, { req }) => value ?? req.body.roomId)
    .isString()
    .withMessage('room_id must be a string')
    .trim()
    .notEmpty()
    .withMessage('room_id is required'),
]);

router.post('/send', requireAuth, sendValidation, async (req, res, next) => {
  try {
    const result = await sendGift({
      senderId: req.user.sub,
      performerId: req.body.performer_id,
      giftTypeId: req.body.gift_type_id,
      roomId: req.body.room_id,
    });

    emitGiftEvents(req.app.get('io'), result);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { emitGiftEvents, router };
