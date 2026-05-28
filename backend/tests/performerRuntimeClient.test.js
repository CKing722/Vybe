process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  createPerformerRuntimeClient,
  mapMusePerformanceToPerformerCommands,
} = require('../services/performerRuntimeClient');

class FakeWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.sent = [];
    this.listeners = new Map();
    FakeWebSocket.instances.push(this);
    setTimeout(() => this.emit('open', {}), 0);
  }

  addEventListener(event, handler) {
    this.listeners.set(event, handler);
  }

  emit(event, payload) {
    this.listeners.get(event)?.(payload);
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
    setTimeout(() => {
      this.emit('message', {
        data: JSON.stringify({ type: 'performer.state_report', current_pose: 'standing_neutral' }),
      });
      this.emit('message', {
        data: JSON.stringify({ type: 'performer.state_report', current_pose: 'standing_neutral', current_action: 'talk_gesture' }),
      });
    }, 0);
  }

  close() {
    this.closed = true;
  }
}

test('maps MUSE avatar plan into Performer Runtime commands', () => {
  const commands = mapMusePerformanceToPerformerCommands({
    avatar: {
      expression: 'bright_smile',
      motion: 'idle_talk',
      intensity: 0.72,
    },
    voice: {
      audioUrl: 'https://example.test/audio.wav',
      visemes: [{ time_ms: 0, viseme: 'A', weight: 1 }],
    },
  });

  assert.deepEqual(commands.map((command) => command.type), [
    'performer.expression',
    'performer.action',
    'performer.voice_sync',
  ]);
  assert.equal(commands[0].expression, 'smile_wide');
  assert.equal(commands[1].action_id, 'talk_gesture');
  assert.equal(commands[1].requires_permission, 'public');
  assert.equal(commands[2].audio_url, 'https://example.test/audio.wav');
});

test('Performer Runtime client sends commands over WebSocket and resolves on state report', async () => {
  FakeWebSocket.instances = [];
  const client = createPerformerRuntimeClient({
    url: 'ws://runtime.test:9000',
    WebSocketImpl: FakeWebSocket,
    timeoutMs: 250,
  });

  const result = await client.sendCommand({
    type: 'performer.action',
    action_id: 'talk_gesture',
    requires_permission: 'public',
  });

  assert.equal(FakeWebSocket.instances[0].url, 'ws://runtime.test:9000');
  assert.equal(FakeWebSocket.instances[0].sent[0].type, 'performer.action');
  assert.equal(result.responses.at(-1).current_action, 'talk_gesture');
  assert.equal(FakeWebSocket.instances[0].closed, true);
});
