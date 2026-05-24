const express = require('express');
const { body } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { generateGameQuestions } = require('../services/aiQuestions');

const router = express.Router();

const questionsValidation = validate([
  body('theme')
    .optional()
    .isString()
    .withMessage('theme must be a string')
    .isLength({ min: 1, max: 64 })
    .withMessage('theme must be 1-64 characters')
    .trim(),
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('count must be an integer between 1 and 10')
    .toInt(),
]);

router.post('/questions', optionalAuth, questionsValidation, async (req, res, next) => {
  try {
    const result = await generateGameQuestions({
      theme: req.body.theme || req.body.game_type || 'vybe',
      count: req.body.count ?? 5,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
