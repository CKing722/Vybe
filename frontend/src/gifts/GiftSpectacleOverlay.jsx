import { useState, useEffect, useRef } from "react";
import { GIFT_EFFECT_MAP, PLATFORM_BANNER_THRESHOLD_SPARKS } from "./giftEffectCatalog.js";
import useReducedMotion from "./useReducedMotion.js";
import CanvasParticleRenderer from "./CanvasParticleRenderer.jsx";

/* -----------------------------------------------------------------------
   GiftSpectacleOverlay
   Props:
     giftId   - string, key in GIFT_EFFECT_MAP (e.g. "neon_rose")
     sender   - string, display name of sender
     visible  - boolean, mount/unmount trigger
     onDone   - callback fired when animation cycle completes
   ----------------------------------------------------------------------- */
export default function GiftSpectacleOverlay({ giftId, sender = "Someone", visible, onDone }) {
  const [phase, setPhase] = useState("idle"); // idle | entry | hold | exit | done
  const timers = useRef([]);
  const reducedMotion = useReducedMotion();

  const effect = giftId ? GIFT_EFFECT_MAP[giftId] : null;

  useEffect(() => {
    if (!visible || !effect) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    // In reduced-motion mode skip directly to hold then exit without animated phases.
    if (reducedMotion) {
      setPhase("hold");
      const holdMs = Math.min(effect.durationMs, 2000);
      const exitT = setTimeout(() => setPhase("exit"), holdMs);
      const doneT = setTimeout(() => { setPhase("done"); onDone && onDone(); }, holdMs + 200);
      timers.current.push(exitT, doneT);
      return () => timers.current.forEach(clearTimeout);
    }

    const phases = effect.effectPhases;

    setPhase("entry");

    let elapsed = 0;
    phases.forEach((p, i) => {
      const t = setTimeout(() => {
        setPhase(i === phases.length - 1 ? "exit" : p.phase);
      }, elapsed);
      timers.current.push(t);
      elapsed += p.durationMs;
    });

    const doneTimer = setTimeout(() => {
      setPhase("done");
      onDone && onDone();
    }, effect.durationMs);
    timers.current.push(doneTimer);

    return () => timers.current.forEach(clearTimeout);
  }, [visible, giftId, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!effect || !visible || phase === "idle" || phase === "done") return null;

  const isHigh = effect.tier === "high";
  const isBanner = effect.platformWideBanner && effect.sparkCost >= PLATFORM_BANNER_THRESHOLD_SPARKS;
  const pal = effect.palette;
  const typo = effect.typography;

  const headline = typo.bannerHeadline
    ? typo.bannerHeadline.replace("{sender}", sender)
    : sender + " sent " + effect.displayName;

  if (isHigh) {
    return <HighTierOverlay effect={effect} pal={pal} typo={typo} headline={headline} isBanner={isBanner} phase={phase} reducedMotion={reducedMotion} />;
  }
  return <LowTierToast effect={effect} pal={pal} typo={typo} sender={sender} phase={phase} reducedMotion={reducedMotion} />;
}

/* -----------------------------------------------------------------------
   Low-tier: subtle corner toast - does not interrupt room content
   ----------------------------------------------------------------------- */
function LowTierToast({ effect, pal, typo, sender, phase, reducedMotion }) {
  const entering = !reducedMotion && phase === "entry";
  const exiting = !reducedMotion && phase === "exit";

  const s = {
    position: "fixed",
    bottom: "80px",
    right: "16px",
    zIndex: 1200,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "24px",
    background: "rgba(20,20,28,0.88)",
    border: "1px solid " + pal.primary + "55",
    boxShadow: "0 0 16px " + (pal.glow || pal.primary + "44"),
    color: pal.text || "#fff",
    fontFamily: typo.displayFont === "monospace" ? "monospace" : "inherit",
    fontWeight: typo.weight || 500,
    fontSize: "13px",
    letterSpacing: typo.letterSpacing || "0.04em",
    transition: "opacity 0.35s ease, transform 0.35s ease",
    opacity: entering || exiting ? (exiting ? 0 : 1) : 1,
    transform: entering ? "translateY(8px) scale(0.93)" : exiting ? "translateY(-4px) scale(0.96)" : "translateY(0) scale(1)",
    pointerEvents: "none",
    maxWidth: "220px",
  };

  const dot = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: pal.primary,
    boxShadow: "0 0 6px " + pal.primary,
    flexShrink: 0,
  };

  return (
    <div style={s} aria-live="polite" aria-label={sender + " sent " + effect.displayName}>
      <span style={dot} />
      <span style={{ color: pal.primary, fontWeight: 600 }}>{sender}</span>
      <span style={{ opacity: 0.75 }}>sent</span>
      <span style={{ fontWeight: 600 }}>{effect.displayName}</span>
    </div>
  );
}

/* -----------------------------------------------------------------------
   High-tier: cinematic full-room overlay with optional platform banner
   ----------------------------------------------------------------------- */
function HighTierOverlay({ effect, pal, typo, headline, isBanner, phase, reducedMotion }) {
  const entering = !reducedMotion && (phase === "entry" || phase === "cinematic-open");
  const exiting = !reducedMotion && phase === "exit";

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: pal.bannerBackground || "rgba(0,0,0,0.82)",
    transition: "opacity 0.5s ease",
    opacity: entering ? 0 : exiting ? 0 : 1,
    pointerEvents: "none",
  };

  const cardStyle = {
    width: "min(520px, 90vw)",
    padding: "32px 28px 28px",
    borderRadius: "16px",
    background: pal.bannerBackground || "rgba(12,10,0,0.94)",
    border: "1.5px solid " + pal.primary + "88",
    boxShadow:
      "0 0 40px " + (pal.glow || pal.primary + "55") + ", " +
      "0 0 80px " + (pal.glow || pal.primary + "22"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease",
    transform: entering ? "scale(0.88) translateY(20px)" : exiting ? "scale(0.96) translateY(-8px)" : "scale(1) translateY(0)",
    opacity: entering ? 0 : exiting ? 0 : 1,
  };

  const badgeStyle = {
    padding: "4px 14px",
    borderRadius: "12px",
    background: pal.primary + "22",
    border: "1px solid " + pal.primary + "66",
    color: pal.primary,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  };

  const headlineStyle = {
    fontFamily: typo.displayFont === "monospace" ? "monospace" : "inherit",
    fontWeight: typo.weight || 700,
    fontSize: typo.size === "2xl" ? "clamp(1.4rem, 4vw, 2rem)" : "clamp(1.2rem, 3.5vw, 1.6rem)",
    letterSpacing: typo.letterSpacing || "0.1em",
    textTransform: typo.casing === "uppercase" ? "uppercase" : "none",
    color: pal.primary,
    textAlign: "center",
    lineHeight: 1.25,
    margin: 0,
  };

  const sublineStyle = {
    fontSize: "13px",
    color: pal.secondary || "#aaa",
    letterSpacing: "0.08em",
    textAlign: "center",
    opacity: 0.85,
  };

  const sparkBadgeStyle = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 12px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.06)",
    color: pal.primary,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    marginTop: "4px",
  };

  const dividerStyle = {
    width: "48px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, " + pal.primary + ", transparent)",
    borderRadius: "1px",
    margin: "4px 0",
  };

  return (
    <div style={backdropStyle} aria-modal="true" aria-live="assertive" role="dialog" aria-label={headline}>
      <div style={cardStyle}>
        {isBanner && (
          <div style={badgeStyle}>
            {effect.sparkCost >= 5000 ? "CINEMATIC" : "PLATFORM MOMENT"}
          </div>
        )}

        <div style={headlineStyle}>{headline}</div>

        <div style={dividerStyle} />

        {typo.subline && (
          <div style={sublineStyle}>{typo.subline}</div>
        )}

        {typo.showSparkCount && (
          <div style={sparkBadgeStyle}>
            <span>&#9889;</span>
            <span>{effect.sparkCost.toLocaleString()} sparks</span>
          </div>
        )}
      </div>

      {!reducedMotion && <CanvasParticleRenderer pal={pal} budget={effect.particleBudget} phase={phase} />}
    </div>
  );
}

/* -----------------------------------------------------------------------
   ParticleBurst - CSS-only particle system, no canvas dependency
   Budget-capped, tier-aware. Renders only during active phases.
   ----------------------------------------------------------------------- */
function ParticleBurst({ pal, budget, phase }) {
  if (!budget || phase === "exit") return null;

  const count = Math.min(budget.count, 24); // DOM cap - canvas handles full budget in renderer
  const spread = budget.spread || "radial-tight";

  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    const radius = spread === "cascade-down"
      ? 60 + Math.random() * 80
      : spread === "matrix-fall"
        ? 40 + Math.random() * 120
        : 30 + Math.random() * 60;
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * radius;
    const ty = spread === "cascade-down"
      ? Math.abs(Math.sin(rad) * radius) + 30
      : spread === "matrix-fall"
        ? Math.sin(rad) * radius + (Math.random() > 0.5 ? 80 : -40)
        : Math.sin(rad) * radius;
    const size = Math.max(2, Math.min(budget.maxRadius || 6, 3 + Math.random() * 4));
    const delay = (i / count) * 0.6;
    const duration = 0.8 + Math.random() * 0.6;

    const keyframeId = "p" + i;
    return { tx, ty, size, delay, duration, keyframeId };
  });

  const containerStyle = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  };

  const centerStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 0,
    height: 0,
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes vybe-particle {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          80%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
      <div style={centerStyle}>
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: p.size + "px",
              height: p.size + "px",
              borderRadius: "50%",
              background: i % 3 === 0 ? pal.secondary || pal.primary : pal.primary,
              boxShadow: "0 0 " + (p.size * 2) + "px " + pal.primary,
              top: "-" + (p.size / 2) + "px",
              left: "-" + (p.size / 2) + "px",
              animation: "vybe-particle " + p.duration + "s " + p.delay + "s ease-out forwards",
              transform: "translate(" + p.tx + "px, " + p.ty + "px)",
              animationFillMode: "both",
            }}
          />
        ))}
      </div>
    </div>
  );
}
