const DEFAULT_TIMEOUT_MS = 2000;

const EXPRESSION_MAP = {
  sparkle_wide: 'smile_wide',
  soft_smile: 'smile',
  focused_boundary: 'focus',
  side_eye_smile: 'smile',
  raised_brow: 'focus',
  knowing_smile: 'smile',
  bright_smile: 'smile_wide',
};

const MOTION_MAP = {
  celebrate_full: { actionId: 'react_celebrate', permission: 'public' },
  acknowledge_small: { actionId: 'acknowledge_gift', permission: 'public' },
  point_to_game: { actionId: 'point_to_game', permission: 'public' },
  lean_in: { actionId: 'lean_forward', permission: 'public' },
  settle_forward: { actionId: 'settle_forward', permission: 'public' },
  idle_talk: { actionId: 'talk_gesture', permission: 'public' },
};

function clamp01(value, fallback = 0.5) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

function mapMusePerformanceToPerformerCommands(performance = {}) {
  const avatar = performance.avatar || {};
  const voice = performance.voice || {};
  const intensity = clamp01(avatar.intensity, 0.5);
  const commands = [];

  if (avatar.expression) {
    commands.push({
      type: 'performer.expression',
      expression: EXPRESSION_MAP[avatar.expression] || avatar.expression,
      intensity,
      blend_seconds: 0.25,
    });
  }

  if (avatar.motion) {
    const motion = MOTION_MAP[avatar.motion] || { actionId: avatar.motion, permission: 'public' };
    commands.push({
      type: 'performer.action',
      action_id: motion.actionId,
      intensity,
      loop: false,
      blend_in: 0.25,
      blend_out: 0.35,
      requires_permission: motion.permission,
    });
  }

  if (voice.audioUrl || voice.audio_url) {
    commands.push({
      type: 'performer.voice_sync',
      audio_url: voice.audioUrl || voice.audio_url,
      viseme_data: voice.visemes || voice.viseme_data || [],
      body_energy: intensity,
    });
  }

  return commands;
}

function createPerformerRuntimeClient({
  url = process.env.PERFORMER_RUNTIME_URL || 'ws://127.0.0.1:9000',
  WebSocketImpl = globalThis.WebSocket,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!WebSocketImpl) {
    throw new Error('WebSocket implementation is required for Performer Runtime client');
  }

  async function sendCommand(command) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocketImpl(url);
      const responses = [];
      const timeout = setTimeout(() => {
        try {
          ws.close();
        } catch (error) {
          // Ignore close failures during timeout cleanup.
        }
        reject(new Error(`Performer Runtime timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const cleanup = () => clearTimeout(timeout);
      const fail = (error) => {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      const handleMessage = (raw) => {
        const text = typeof raw?.data === 'string' ? raw.data : String(raw?.data || raw);
        const message = JSON.parse(text);
        responses.push(message);

        if (message.type === 'performer.state_report' && responses.length > 1) {
          cleanup();
          ws.close();
          resolve({ command, responses });
        }
      };

      const open = () => ws.send(JSON.stringify(command));
      if (typeof ws.addEventListener === 'function') {
        ws.addEventListener('open', open);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('error', fail);
      } else {
        ws.onopen = open;
        ws.onmessage = handleMessage;
        ws.onerror = fail;
      }
    });
  }

  async function sendPerformancePlan(performance) {
    const commands = mapMusePerformanceToPerformerCommands(performance);
    const results = [];
    for (const command of commands) {
      results.push(await sendCommand(command));
    }
    return { commands, results };
  }

  return {
    sendCommand,
    sendPerformancePlan,
  };
}

module.exports = {
  createPerformerRuntimeClient,
  mapMusePerformanceToPerformerCommands,
};
