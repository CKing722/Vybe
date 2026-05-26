import { useRef, useCallback, useEffect } from "react";

function getCtx(ctxRef) {
  if (!ctxRef.current) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    } catch { /* no-op: audio unavailable */ }
  }
  return ctxRef.current;
}

function resumeCtx(ctx) {
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// Schedules a single sine/sawtooth oscillator burst.
function scheduleOsc(ctx, { type = "sine", freq, freqEnd, startT, stopT, peakGain, attackT, releaseT }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startT);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, startT + attackT);
  gain.gain.setValueAtTime(0, startT);
  gain.gain.linearRampToValueAtTime(peakGain, startT + attackT);
  gain.gain.exponentialRampToValueAtTime(0.0001, stopT);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startT);
  osc.stop(stopT);
}

/*
  useGiftAudio
  Provides tier-appropriate synthetic audio feedback for gift spectacle events.
  Uses Web Audio API oscillators — no external assets, no network requests.

  Props (object):
    muted - boolean, skip all sound when true (e.g. user toggled mute)

  Returns:
    playGiftSound(tier) - call with "low" | "mid" | "high" when a gift plays
*/
export default function useGiftAudio({ muted = false } = {}) {
  const ctxRef = useRef(null);

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, []);

  const playGiftSound = useCallback(
    (tier) => {
      if (muted) return;
      const ctx = getCtx(ctxRef);
      if (!ctx) return;
      resumeCtx(ctx);

      const t = ctx.currentTime;

      if (tier === "low") {
        // Soft descending bell: subtle, does not interrupt room content.
        scheduleOsc(ctx, {
          type: "sine",
          freq: 880,
          freqEnd: 660,
          startT: t,
          stopT: t + 1.4,
          peakGain: 0.14,
          attackT: 0.018,
          releaseT: 1.4,
        });
        // Sub-harmonic shimmer
        scheduleOsc(ctx, {
          type: "sine",
          freq: 440,
          startT: t + 0.04,
          stopT: t + 1.2,
          peakGain: 0.06,
          attackT: 0.03,
          releaseT: 1.2,
        });
      } else if (tier === "mid") {
        // Crystal resonance: harmonic stagger for gem-like shimmer.
        const pairs = [
          { freq: 659.25, delay: 0,    gain: 0.12 },
          { freq: 880,    delay: 0.06, gain: 0.10 },
          { freq: 1318.5, delay: 0.12, gain: 0.07 },
        ];
        pairs.forEach(({ freq, delay, gain }) => {
          scheduleOsc(ctx, {
            type: "sine",
            freq,
            startT: t + delay,
            stopT: t + delay + 2.2,
            peakGain: gain,
            attackT: 0.03,
            releaseT: 2.2,
          });
        });
      } else if (tier === "high") {
        // Cinematic minor swell: slow build, rich chord, dramatic presence.
        // A minor chord: A2 + C3 + E3 + A3, plus filtered sawtooth foundation.
        const voices = [
          { type: "sawtooth", freq: 110,  gain: 0.05, attack: 0.5, stop: 4.0 },
          { type: "sine",     freq: 220,  gain: 0.10, attack: 0.4, stop: 4.0 },
          { type: "sine",     freq: 261.6,gain: 0.09, attack: 0.45,stop: 3.8 },
          { type: "sine",     freq: 329.6,gain: 0.08, attack: 0.5, stop: 3.6 },
          { type: "sine",     freq: 440,  gain: 0.07, attack: 0.55,stop: 3.4 },
          { type: "sine",     freq: 880,  gain: 0.04, attack: 0.7, stop: 3.0 },
        ];
        voices.forEach(({ type, freq, gain, attack, stop }) => {
          scheduleOsc(ctx, {
            type,
            freq,
            startT: t,
            stopT: t + stop,
            peakGain: gain,
            attackT: attack,
            releaseT: stop,
          });
        });
        // Impact transient: short percussive sine burst at start
        scheduleOsc(ctx, {
          type: "sine",
          freq: 55,
          freqEnd: 30,
          startT: t,
          stopT: t + 0.28,
          peakGain: 0.18,
          attackT: 0.004,
          releaseT: 0.28,
        });
      }
    },
    [muted]
  );

  return { playGiftSound };
}
