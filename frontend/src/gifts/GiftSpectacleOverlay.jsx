import { useState, useEffect, useRef } from "react";
import { GIFT_EFFECT_MAP, PLATFORM_BANNER_THRESHOLD_SPARKS } from "./giftEffectCatalog.js";
import useReducedMotion from "./useReducedMotion.js";
import CanvasParticleRenderer from "./CanvasParticleRenderer.jsx";

/* -----------------------------------------------------------------------
   GiftSpectacleOverlay
   Props:
     giftId   - string, key in GIFT_EFFECT_MAP (e.g. "neon_rose")
     sender   - string, display name of sender
     recipient - string, performer/room receiving the gift
     visible  - boolean, mount/unmount trigger
     onDone   - callback fired when animation cycle completes
   ----------------------------------------------------------------------- */
export default function GiftSpectacleOverlay({ giftId, sender = "Someone", recipient = "this room", visible, onDone }) {
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
    return <HighTierOverlay effect={effect} pal={pal} typo={typo} sender={sender} recipient={recipient} headline={headline} isBanner={isBanner} phase={phase} reducedMotion={reducedMotion} />;
  }
  return <LowTierToast effect={effect} pal={pal} typo={typo} sender={sender} phase={phase} reducedMotion={reducedMotion} />;
}

/* -----------------------------------------------------------------------
   Low-tier: subtle corner toast - does not interrupt room content
   ----------------------------------------------------------------------- */
function LowTierToast({ effect, pal, typo, sender, phase, reducedMotion }) {
  const entering = !reducedMotion && phase === "entry";
  const exiting = !reducedMotion && phase === "exit";
  const holding = !reducedMotion && phase === "hold";

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
    animation: holding ? "vybe-toast-dot-pulse 1.1s ease-in-out infinite" : "none",
  };

  return (
    <div style={s} aria-live="polite" aria-label={sender + " sent " + effect.displayName}>
      {holding && (
        <style>{`@keyframes vybe-toast-dot-pulse{0%,100%{box-shadow:0 0 6px ${pal.primary};transform:scale(1)}50%{box-shadow:0 0 14px ${pal.primary},0 0 26px ${pal.primary}55;transform:scale(1.3)}}`}</style>
      )}
      {!reducedMotion && <ParticleBurst pal={pal} budget={effect.particleBudget} phase={phase} />}
      <span style={dot} />
      <span style={{ color: pal.primary, fontWeight: 600 }}>{sender}</span>
      <span style={{ opacity: 0.75 }}>sent</span>
      <span style={{ fontWeight: 600 }}>{effect.displayName}</span>
    </div>
  );
}

/* -----------------------------------------------------------------------
   High-tier: compact premium 3D room moment, not a full-screen takeover.
   ----------------------------------------------------------------------- */
function HighTierOverlay({ effect, pal, typo, sender, recipient, isBanner, phase, reducedMotion }) {
  const entering = !reducedMotion && (phase === "entry" || phase === "cinematic-open");
  const exiting = !reducedMotion && phase === "exit";
  const isKey = effect.id === "private_key";
  const headline = sender + " sent " + effect.displayName + " to " + recipient;

  const shellStyle = {
    position: "fixed",
    right: "max(18px, 7vw)",
    top: isKey ? "24%" : "22%",
    width: isKey ? "min(210px, 28vw)" : "min(180px, 24vw)",
    height: isKey ? "min(210px, 28vw)" : "min(180px, 24vw)",
    zIndex: 2200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transform: entering
      ? "translateY(12px) scale(0.72) rotateX(14deg)"
      : exiting
        ? "translateY(-8px) scale(0.82) rotateX(0deg)"
        : "translateY(0) scale(1) rotateX(0deg)",
    transition: "opacity 0.45s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)",
    opacity: entering ? 0 : exiting ? 0 : 1,
    pointerEvents: "none",
    perspective: "980px",
  };

  const auraStyle = {
    position: "absolute",
    inset: "9%",
    borderRadius: "50%",
    background: "radial-gradient(circle, " + pal.primary + "22 0%, " + pal.primary + "10 34%, transparent 68%)",
    filter: "blur(10px)",
    transform: "translateZ(-80px)",
  };

  const labelStyle = {
    position: "absolute",
    right: 0,
    bottom: isKey ? "-2px" : "8px",
    minWidth: "min(220px, 52vw)",
    maxWidth: "min(260px, 58vw)",
    padding: "7px 10px",
    borderRadius: "999px",
    border: "1px solid " + pal.primary + "66",
    background: "rgba(5,7,13,0.82)",
    boxShadow: "0 18px 42px rgba(0,0,0,0.36), 0 0 24px " + (pal.glow || pal.primary + "33"),
    color: "#fff",
    textAlign: "center",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.03em",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  };

  const metaStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: pal.primary,
    marginTop: "3px",
    fontSize: "9px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  };

  return (
    <div style={shellStyle} aria-live="assertive" role="status" aria-label={headline}>
      <style>{`
        @keyframes vybe-gift-orbit {
          0% { transform: rotateY(-18deg) rotateX(12deg) translateY(0); }
          50% { transform: rotateY(20deg) rotateX(16deg) translateY(-9px); }
          100% { transform: rotateY(-18deg) rotateX(12deg) translateY(0); }
        }
        @keyframes vybe-gift-crown-drop {
          0% { transform: translateY(-42px) rotateX(28deg) rotateZ(-5deg) scale(0.82); opacity: 0; }
          32% { opacity: 1; }
          58% { transform: translateY(6px) rotateX(18deg) rotateZ(3deg) scale(1.05); }
          100% { transform: translateY(0) rotateX(14deg) rotateZ(0deg) scale(1); opacity: 1; }
        }
        @keyframes vybe-gift-ring {
          0% { transform: translate(-50%, -50%) rotateX(70deg) scale(0.72); opacity: 0; }
          35% { opacity: 0.9; }
          100% { transform: translate(-50%, -50%) rotateX(70deg) scale(1.28); opacity: 0; }
        }
      `}</style>
      <div style={auraStyle} />
      {!reducedMotion && <CanvasParticleRenderer pal={pal} budget={effect.particleBudget} phase={phase} />}
      <Gift3DObject effect={effect} pal={pal} reducedMotion={reducedMotion} />
      <div style={labelStyle}>
        <div>{headline}</div>
        <div style={metaStyle}>
          <span>{isBanner ? "Platform banner live" : "Room gift"}</span>
          {typo.showSparkCount && <span>{effect.sparkCost.toLocaleString()} sparks</span>}
        </div>
      </div>
    </div>
  );
}

function Gift3DObject({ effect, pal, reducedMotion }) {
  const objectStyle = {
    position: "relative",
    width: effect.id === "private_key" ? "180px" : "154px",
    height: effect.id === "private_key" ? "180px" : "154px",
    transformStyle: "preserve-3d",
    animation: reducedMotion ? "none" : (effect.id === "crown_drop" ? "vybe-gift-crown-drop 900ms cubic-bezier(0.16,1,0.3,1) both, vybe-gift-orbit 2.6s ease-in-out 900ms infinite" : "vybe-gift-orbit 2.8s ease-in-out infinite"),
    filter: "drop-shadow(0 22px 32px rgba(0,0,0,0.52)) drop-shadow(0 0 24px " + (pal.glow || pal.primary + "55") + ")",
  };

  const ringStyle = {
    position: "absolute",
    left: "50%",
    top: "55%",
    width: "210px",
    height: "64px",
    borderRadius: "50%",
    border: "1px solid " + pal.primary + "66",
    boxShadow: "0 0 28px " + (pal.glow || pal.primary + "44"),
    animation: reducedMotion ? "none" : "vybe-gift-ring 1.8s ease-out infinite",
  };

  return (
    <>
      <div style={ringStyle} />
      <div style={objectStyle}>
        {effect.id === "private_key" ? <KeyMesh pal={pal} /> : <CrownMesh pal={pal} />}
      </div>
    </>
  );
}

function CrownMesh({ pal }) {
  return (
    <svg viewBox="0 0 220 180" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="vybeCrownFace" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff7b2" />
          <stop offset="0.42" stopColor={pal.primary} />
          <stop offset="1" stopColor="#9c6b00" />
        </linearGradient>
        <linearGradient id="vybeCrownSide" x1="0" x2="1">
          <stop offset="0" stopColor="#5f3900" />
          <stop offset="1" stopColor={pal.primary} />
        </linearGradient>
      </defs>
      <path d="M29 134 L48 48 L86 104 L110 28 L134 104 L172 48 L191 134 Z" fill="url(#vybeCrownSide)" opacity="0.7" transform="translate(10,10)" />
      <path d="M25 128 L45 42 L83 99 L110 22 L137 99 L175 42 L195 128 Z" fill="url(#vybeCrownFace)" stroke="#fff3a6" strokeWidth="3" strokeLinejoin="round" />
      <rect x="32" y="124" width="156" height="28" rx="10" fill="url(#vybeCrownFace)" stroke="#fff3a6" strokeWidth="3" />
      {[45,110,175].map((x, i) => <circle key={i} cx={x} cy={i === 1 ? 23 : 43} r="11" fill="#fff7c8" opacity="0.95" />)}
      <path d="M42 136 C78 148 141 148 178 136" fill="none" stroke="#fff7cc" strokeWidth="4" opacity="0.55" />
    </svg>
  );
}

function KeyMesh({ pal }) {
  return (
    <svg viewBox="0 0 220 180" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="vybeKeyFace" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#dfffee" />
          <stop offset="0.46" stopColor={pal.primary} />
          <stop offset="1" stopColor={pal.secondary || "#005c40"} />
        </linearGradient>
      </defs>
      <g transform="rotate(-24 110 90)">
        <circle cx="72" cy="82" r="40" fill="rgba(0,255,178,0.18)" stroke={pal.primary} strokeWidth="14" />
        <circle cx="72" cy="82" r="17" fill="rgba(5,7,13,0.86)" stroke="#dfffee" strokeWidth="4" />
        <rect x="107" y="72" width="86" height="22" rx="11" fill="url(#vybeKeyFace)" stroke="#dfffee" strokeWidth="3" />
        <rect x="165" y="89" width="16" height="29" rx="5" fill="url(#vybeKeyFace)" />
        <rect x="187" y="89" width="15" height="22" rx="5" fill="url(#vybeKeyFace)" />
        <path d="M34 101 C74 126 139 121 197 91" fill="none" stroke="#dfffee" strokeWidth="5" opacity="0.3" />
      </g>
    </svg>
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
