const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { generateGameQuestions } = require('../services/aiQuestions');

const router = express.Router();

router.post('/questions', optionalAuth, async (req, res, next) => {
  try {
    const result = await generateGameQuestions({
      theme: req.body.theme || req.body.game_type || 'vybe',
      count: Math.min(10, Number(req.body.count || 5)),
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
