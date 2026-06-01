const express = require('express');
const { body, param, query } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { listConversations, listDirectMessages, sendDirectMessage } = require('../services/chatService');

const router = express.Router();

const conversationsValidation = validate([
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100').toInt(),
]);

const messagesValidation = validate([
  param('userId').isUUID().withMessage('userId must be a UUID'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be 1-200').toInt(),
]);

const sendValidation = validate([
  body('recipient_id')
    .customSanitizer((value, { req }) => value ?? req.body.recipientId)
    .isUUID()
    .withMessage('recipient_id must be a UUID'),
  body('message')
    .isString()
    .withMessage('message must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('message must be 1-500 characters'),
]);

router.get('/conversations', requireAuth, conversationsValidation, async (req, res, next) => {
  try {
    const conversations = await listConversations(req.user.sub, { limit: req.query.limit });
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
});

router.get('/:userId', requireAuth, messagesValidation, async (req, res, next) => {
  try {
    const messages = await listDirectMessages(req.user.sub, req.params.userId, {
      limit: req.query.limit,
    });
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post('/send', requireAuth, sendValidation, async (req, res, next) => {
  try {
    const message = await sendDirectMessage({
      senderId: req.user.sub,
      recipientId: req.body.recipient_id,
      message: req.body.message,
    });
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

