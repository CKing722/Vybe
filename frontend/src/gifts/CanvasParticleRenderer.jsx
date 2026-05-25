import { useEffect, useRef } from "react";

// ASCII cipher glyphs for Private Key matrix-fall mode
const CIPHER_GLYPHS = ["#", "0", "1", "$", ">", "<", "{", "}", "|", "~", "@", "!"];

function spawnParticles(budget, w, h) {
  const count = budget.count;
  const spread = budget.spread || "radial-tight";
  const cx = w / 2;
  const cy = h / 2;

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    let x, y, vx, vy;

    if (spread === "cascade-down") {
      x = cx + (Math.random() - 0.5) * w * 0.5;
      y = cy - 30;
      const sp = 1.8 + Math.random() * 2.2;
      vx = (Math.random() - 0.5) * sp * 1.3;
      vy = -(sp * 0.6 + Math.random() * sp * 0.4);
    } else if (spread === "matrix-fall") {
      x = w * 0.05 + Math.random() * w * 0.9;
      y = -(10 + Math.random() * h * 0.3);
      vx = (Math.random() - 0.5) * 0.5;
      vy = 1.8 + Math.random() * 2.8;
    } else {
      x = cx + (Math.random() - 0.5) * 6;
      y = cy + (Math.random() - 0.5) * 6;
      const sp = 2 + Math.random() * 2.5;
      vx = Math.cos(angle) * sp;
      vy = Math.sin(angle) * sp;
    }

    // glitterEnabled: ~1/3 of particles become sparkle shapes
    const isGlitter = budget.glitterEnabled && Math.random() < 0.38;

    return {
      x, y, vx, vy,
      size: 2 + Math.random() * Math.max(2, (budget.maxRadius || 8) - 2),
      life: 0.65 + Math.random() * 0.35,
      decay: 0.005 + Math.random() * 0.007,
      useSecondary: Math.random() > 0.62,
      glyph: budget.cipherGlyphs
        ? CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)]
        : null,
      isGlitter,
      // glitter particles spin for sparkle effect
      rot: isGlitter ? Math.random() * Math.PI * 2 : 0,
      rotV: isGlitter ? (Math.random() - 0.5) * 0.18 : 0,
    };
  });
}

// Draws a 4-pointed star (sparkle) centered at (0,0) with outer radius r.
function drawSparkle(ctx, r) {
  const inner = r * 0.38;
  const pts = 4;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = (i * Math.PI) / pts - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    if (i === 0) ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
    else ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

function sizeCanvas(canvas) {
  const rect = canvas.parentElement?.getBoundingClientRect();
  const cssW = Math.max(1, Math.floor(rect?.width || window.innerWidth || 800));
  const cssH = Math.max(1, Math.floor(rect?.height || window.innerHeight || 600));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  return { cssW, cssH, dpr };
}

/*
  CanvasParticleRenderer
  Props:
    pal    - palette from giftEffectCatalog (primary, secondary, glow)
    budget - particleBudget from giftEffectCatalog (count, maxRadius, spread, cipherGlyphs)
    phase  - current animation phase string (returns null on "exit" to match ParticleBurst API)
*/
export default function CanvasParticleRenderer({ pal, budget, phase }) {
  const canvasRef = useRef(null);
  const animIdRef = useRef(null);

  // active drives both the effect guard and the conditional render below.
  // All hooks are called unconditionally to satisfy Rules of Hooks.
  const active = !!budget && phase !== "exit";

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { cssW: w, cssH: h, dpr } = sizeCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const spread = budget.spread || "radial-tight";

    // Cap particle count on narrow viewports to protect mobile frame rate.
    const isMobile = w < 480;
    const effectiveBudget = isMobile
      ? { ...budget, count: Math.min(budget.count, 32) }
      : budget;

    const particles = spawnParticles(effectiveBudget, w, h);

    // trailFade=false: hard-edge particles stay opaque until nearly dead
    const hardEdge = budget.trailFade === false;

    function tick() {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;

      for (const p of particles) {
        if (p.life <= 0) continue;
        alive++;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.isGlitter) p.rot += p.rotV;

        if (spread === "cascade-down") p.vy += 0.07;
        if (spread === "matrix-fall") p.vy += 0.014;

        // trailFade=false: full opacity until last 20% of life
        const a = hardEdge
          ? (p.life > 0.2 ? 1 : Math.max(0, p.life / 0.2))
          : Math.max(0, p.life);

        const color = p.useSecondary ? (pal.secondary || pal.primary) : pal.primary;

        ctx.globalAlpha = a;
        ctx.shadowColor = pal.primary;

        if (p.glyph) {
          const fs = Math.max(8, Math.round(p.size * 2.2));
          ctx.font = fs + "px monospace";
          ctx.fillStyle = color;
          ctx.shadowBlur = p.size * 1.4;
          ctx.fillText(p.glyph, p.x, p.y);
        } else if (p.isGlitter) {
          // 4-pointed sparkle for glitterEnabled particles
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = color;
          ctx.shadowBlur = p.size * 3.5;
          drawSparkle(ctx, Math.max(1, p.size * 0.7));
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.size * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowBlur = p.size * 2.2;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (alive > 0) {
        animIdRef.current = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      cancelAnimationFrame(animIdRef.current);
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
