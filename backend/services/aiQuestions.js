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
  if (!env.enablePaidAi) {
    return {
      provider: 'local',
      paidProviderUsed: false,
      questions: rotateQuestions(theme, count),
    };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content:
            'Generate playful, suggestive but non-explicit live-game trivia. Return only JSON with q, opts, ans fields.',
        },
      ],
    }),
  });

  if (!response.ok) {
    return {
      provider: 'local',
      paidProviderUsed: false,
      fallbackReason: `Anthropic returned ${response.status}`,
      questions: rotateQuestions(theme, count),
    };
  }

  const body = await response.json();
  const text = body.content?.map((item) => item.text || '').join('\n') || '[]';
  return {
    provider: 'anthropic',
    paidProviderUsed: true,
    questions: JSON.parse(text).slice(0, count),
  };
}

module.exports = {
  generateGameQuestions,
  rotateQuestions,
};
