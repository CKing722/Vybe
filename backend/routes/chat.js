const express = require('express');
const { body, param } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { listConversations, listMessagesWithUser, sendChatMessage } = require('../services/chatService');

const router = express.Router();

const sendValidation = validate([
  body('recipient_id')
    .customSanitizer((value, { req }) => value ?? req.body.recipientId ?? req.body.userId)
    .isString()
    .withMessage('recipient_id must be a string')
    .trim()
    .notEmpty()
    .withMessage('recipient_id is required'),
  body('message')
    .customSanitizer((value, { req }) => value ?? req.body.body ?? req.body.text)
    .isString()
    .withMessage('message must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('message must be 1-500 characters'),
]);

router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const conversations = await listConversations(req.user.sub, {
      limit: Math.min(100, Number(req.query.limit || 25)),
    });
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
});

const userValidation = validate([
  param('userId')
    .isString()
    .withMessage('userId must be a string')
    .trim()
    .notEmpty()
    .withMessage('userId is required'),
]);

router.get('/:userId', requireAuth, userValidation, async (req, res, next) => {
  try {
    const result = await listMessagesWithUser(req.user.sub, req.params.userId, {
      limit: Math.min(250, Number(req.query.limit || 50)),
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/send', requireAuth, sendValidation, async (req, res, next) => {
  try {
    const result = await sendChatMessage({
      senderId: req.user.sub,
      recipientId: req.body.recipient_id,
      message: req.body.message,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
