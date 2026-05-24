const { env } = require('../config/env');

const LOCAL_QUESTION_BANK = [
  {
    q: 'Which room detail sets the strongest mood before a private session starts?',
    opts: ['Lighting', 'Volume', 'Camera angle', 'Opening line'],
    ans: 0,
  },
  {
    q: 'What should a great live game reward besides winning?',
    opts: ['Presence', 'Silence', 'Waiting', 'Skipping'],
    ans: 0,
  },
  {
    q: 'Which gift tier should trigger a platform-wide banner?',
    opts: ['Crown Drop', 'Neon Rose', 'Fire Shot', 'Blow Kiss'],
    ans: 0,
  },
  {
    q: 'What makes a Spark Storm feel communal?',
    opts: ['Shared progress', 'Hidden scores', 'Muted chat', 'Static UI'],
    ans: 0,
  },
  {
    q: 'Which profile signal most clearly says a viewer is known here?',
    opts: ['History', 'Blank bio', 'Random name', 'No badges'],
    ans: 0,
  },
];

function rotateQuestions(seed = '', count = 5) {
  const offset = [...String(seed)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: count }, (_, index) => {
    const question = LOCAL_QUESTION_BANK[(offset + index) % LOCAL_QUESTION_BANK.length];
    return { ...question, opts: [...question.opts] };
  });
}

async function generateGameQuestions({ theme = 'vybe', count = 5 } = {}) {
  return {
    provider: 'local',
    paidProviderUsed: false,
    rawProviderApisEnabled: env.enablePaidAi,
    questions: rotateQuestions(theme, count),
  };
}

module.exports = {
  generateGameQuestions,
  rotateQuestions,
};
