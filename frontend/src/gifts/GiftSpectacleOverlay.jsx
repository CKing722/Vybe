import { useState, useEffect, useRef, useMemo } from "react";
import { GIFT_EFFECT_MAP, PLATFORM_BANNER_THRESHOLD_SPARKS } from "./giftEffectCatalog.js";
import useReducedMotion from "./useReducedMotion.js";
import CanvasParticleRenderer from "./CanvasParticleRenderer.jsx";
import useGiftAudio from "./useGiftAudio.js";
import useHapticFeedback from "./useHapticFeedback.js";

const GIFT_STAGE_ANCHOR = {
  top: "22%",
  right: "max(18px, 7vw)",
};

/* -----------------------------------------------------------------------
   GiftSpectacleOverlay
   Props:
     giftId   - string, key in GIFT_EFFECT_MAP (e.g. "neon_rose")
     sender   - string, display name of sender
     recipient - string, performer/room receiving the gift
     visible  - boolean, mount/unmount trigger
     onDone   - callback fired when animation cycle completes
   ----------------------------------------------------------------------- */
export default function GiftSpectacleOverlay({ giftId, sender = "Someone", recipient = "this room", visible, onDone, muted = false, queueLength = 0 }) {
  const [phase, setPhase] = useState("idle"); // idle | entry | hold | exit | done
  const timers = useRef([]);
  const reducedMotion = useReducedMotion();
  const { playGiftSound } = useGiftAudio({ muted });
  const { fire: haptic } = useHapticFeedback();

  const effect = giftId ? GIFT_EFFECT_MAP[giftId] : null;

  useEffect(() => {
    if (!visible || !effect) return;
    playGiftSound(effect.tier);
    haptic(effect.tier);

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
  const isMid = effect.tier === "mid";
  const isBanner = effect.platformWideBanner && effect.sparkCost >= PLATFORM_BANNER_THRESHOLD_SPARKS;
  const pal = effect.palette;
  const typo = effect.typography;

  const headline = typo.bannerHeadline
    ? typo.bannerHeadline.replace("{sender}", sender)
    : sender + " sent " + effect.displayName;

  if (isHigh) {
    return <HighTierOverlay effect={effect} pal={pal} typo={typo} sender={sender} recipient={recipient} headline={headline} isBanner={isBanner} phase={phase} reducedMotion={reducedMotion} queueLength={queueLength} />;
  }
  if (isMid) {
    return <MidTierBurst effect={effect} pal={pal} typo={typo} sender={sender} phase={phase} reducedMotion={reducedMotion} queueLength={queueLength} />;
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
    top: GIFT_STAGE_ANCHOR.top,
    right: GIFT_STAGE_ANCHOR.right,
    zIndex: 1200,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 14px 9px 9px",
    borderRadius: "26px",
    background: "linear-gradient(135deg,rgba(18,20,29,0.9),rgba(6,7,13,0.82))",
    border: "1px solid " + pal.primary + "55",
    boxShadow: "0 18px 46px rgba(0,0,0,.36), 0 0 22px " + (pal.glow || pal.primary + "44"),
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

  return (
    <div style={s} aria-live="polite" aria-label={sender + " sent " + effect.displayName}>
      {!reducedMotion && <style>{`@keyframes vybe-low-object-drift{0%,100%{transform:translateY(0) rotateY(-12deg)}50%{transform:translateY(-4px) rotateY(14deg)}}`}</style>}
      {!reducedMotion && <ParticleBurst pal={pal} budget={effect.particleBudget} phase={phase} />}
      <div style={{ width: 38, height: 38, flexShrink: 0, transformStyle: "preserve-3d", animation: holding ? "vybe-low-object-drift 1.8s ease-in-out infinite" : "none" }}>
        <GiftObjectMesh kind={effect.objectKind || effect.id} pal={pal} />
      </div>
      <div style={{ minWidth: 0, display: "grid", gap: "1px" }}>
        <span style={{ color: pal.primary, fontWeight: 800, fontSize: "12px" }}>{sender}</span>
        <span style={{ fontWeight: 700, color: "#fff", fontSize: "13px" }}>{effect.displayName}</span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
   High-tier: compact premium 3D room moment, not a full-screen takeover.
   ----------------------------------------------------------------------- */
/* -----------------------------------------------------------------------
   High-tier: full-screen cinematic takeover - dims room, centers gift
   ----------------------------------------------------------------------- */
function HighTierOverlay({ effect, pal, typo, sender, recipient, phase, reducedMotion, isBanner, queueLength = 0 }) {
  const entering = !reducedMotion && (phase === "entry" || phase === "cinematic-open" || phase === "blackout");
  const exiting = !reducedMotion && phase === "exit";
  const isKey = effect.id === "private_key";
  const isCinematic = effect.sparkCost >= 5000;
  const headline = typo.bannerHeadline
    ? typo.bannerHeadline.replace("{sender}", sender)
    : sender + " sent " + effect.displayName + " to " + recipient;

  // Use the current phase's overlayDim if available, else sensible defaults
  const curPhaseData = effect.effectPhases.find((p) => p.phase === phase);
  const dimAmount = curPhaseData?.overlayDim ?? (isKey ? 0.88 : 0.65);
  // Camera shake: apply when the current phase requests it
  const shakeMs = !reducedMotion && curPhaseData?.cameraShake
    ? curPhaseData.cameraShake.durationMs
    : 0;
  // Cipher-reveal glitch: Private Key only, 1800ms phase per catalog
  const isCipherReveal = isKey && !reducedMotion && phase === "cipher-reveal";

  const dimStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 2100,
    background: "rgba(0,0,0," + (entering || exiting ? 0 : dimAmount) + ")",
    transition: reducedMotion ? "none" : "background 0.55s ease",
    pointerEvents: "none",
  };

  const shellStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 2200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0px",
    opacity: entering ? 0 : exiting ? 0 : 1,
    transform: entering
      ? "scale(0.72) rotateX(14deg)"
      : exiting
        ? "scale(0.86) rotateX(0deg)"
        : "scale(1) rotateX(0deg)",
    transition: reducedMotion ? "opacity 0.15s ease" : "opacity 0.45s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)",
    perspective: "980px",
    pointerEvents: "none",
    animation: [
      shakeMs ? "vybe-cam-shake " + shakeMs + "ms ease-in-out" : "",
      isCipherReveal ? "vybe-glitch-decode 1800ms ease-out both" : "",
    ].filter(Boolean).join(", ") || "none",
  };

  const auraStyle = {
    position: "absolute",
    width: "70vmin",
    height: "70vmin",
    borderRadius: "50%",
    background: "radial-gradient(circle, " + pal.primary + "1a 0%, " + pal.primary + "0a 42%, transparent 72%)",
    filter: "blur(28px)",
    pointerEvents: "none",
  };

  const labelStyle = {
    marginTop: "22px",
    maxWidth: "min(480px, 86vw)",
    padding: "12px 22px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,.18)",
    background: "linear-gradient(135deg,rgba(255,255,255,.1),rgba(5,7,13,0.86))",
    boxShadow: "0 20px 52px rgba(0,0,0,0.52), 0 0 32px " + (pal.glow || pal.primary + "28"),
    color: "#fff",
    textAlign: "center",
    fontSize: "clamp(0.88rem, 2.4vw, 1.15rem)",
    fontWeight: 800,
    letterSpacing: "0.03em",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    fontFamily: typo.displayFont === "monospace" ? "monospace" : "inherit",
  };

  const metaStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
    color: pal.primary,
    marginTop: "5px",
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  };

  const showGrid = !reducedMotion && (() => {
    const cur = effect.effectPhases.find((p) => p.phase === phase);
    return cur?.gridOverlay === true;
  })();

  return (
    <>
      <div style={dimStyle} />
      <div style={shellStyle} aria-live="assertive" role="status" aria-label={headline}>
        <style>{`
          @keyframes vybe-gift-orbit {
            0% { transform: rotateY(-18deg) rotateX(10deg) translateY(0); }
            50% { transform: rotateY(20deg) rotateX(14deg) translateY(-14px); }
            100% { transform: rotateY(-18deg) rotateX(10deg) translateY(0); }
          }
          @keyframes vybe-gift-crown-drop {
            0% { transform: translateY(-70px) rotateX(32deg) rotateZ(-6deg) scale(0.72); opacity: 0; }
            30% { opacity: 1; }
            60% { transform: translateY(12px) rotateX(20deg) rotateZ(3deg) scale(1.07); }
            100% { transform: translateY(0) rotateX(10deg) rotateZ(0deg) scale(1); opacity: 1; }
          }
          @keyframes vybe-gift-ring {
            0% { transform: translate(-50%,-50%) rotateX(72deg) scale(0.6); opacity: 0; }
            28% { opacity: 0.85; }
            100% { transform: translate(-50%,-50%) rotateX(72deg) scale(1.55); opacity: 0; }
          }
          @keyframes vybe-cam-shake {
            0%,100% { transform: scale(1) rotateX(0deg) translateX(0); }
            20% { transform: scale(1) rotateX(0deg) translateX(-7px); }
            40% { transform: scale(1) rotateX(0deg) translateX(7px); }
            60% { transform: scale(1) rotateX(0deg) translateX(-5px); }
            80% { transform: scale(1) rotateX(0deg) translateX(5px); }
          }
          @keyframes vybe-grid-flicker {
            0%,100% { opacity: 0.55; }
            45% { opacity: 0.82; }
            52% { opacity: 0.28; }
            60% { opacity: 0.76; }
          }
          @keyframes vybe-glitch-decode {
            0%   { clip-path: inset(0 0 98% 0); opacity: 0; }
            4%   { clip-path: inset(0 0 0 0); opacity: 1; transform: translateX(6px); filter: hue-rotate(120deg) brightness(1.6); }
            6%   { transform: translateX(-8px); filter: hue-rotate(240deg) brightness(2); }
            8%   { clip-path: inset(22% 0 44% 0); transform: translateX(0); filter: hue-rotate(0deg) brightness(1); }
            10%  { clip-path: inset(0 0 0 0); }
            18%  { transform: translateX(5px); filter: brightness(1.5); }
            20%  { transform: translateX(-4px); }
            22%  { transform: translateX(0); filter: brightness(1); }
            34%  { clip-path: inset(48% 0 18% 0); }
            36%  { clip-path: inset(0 0 0 0); transform: translateX(4px); }
            38%  { transform: translateX(0); }
            52%  { transform: translateX(-3px) scaleX(1.01); filter: brightness(1.3); }
            54%  { transform: translateX(3px) scaleX(0.99); }
            56%  { transform: translateX(0) scaleX(1); filter: brightness(1); }
            72%  { clip-path: inset(8% 0 62% 0); }
            74%  { clip-path: inset(0 0 0 0); }
            88%  { transform: translateX(2px); }
            90%  { transform: translateX(0); }
            100% { clip-path: inset(0 0 0 0); transform: translateX(0); filter: brightness(1); opacity: 1; }
          }
        `}</style>
        {showGrid && (
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage:
                "linear-gradient(" + (pal.accentGrid || pal.primary + "18") + " 1px, transparent 1px)," +
                "linear-gradient(90deg, " + (pal.accentGrid || pal.primary + "18") + " 1px, transparent 1px)",
              backgroundSize: "52px 52px",
              pointerEvents: "none",
              zIndex: 2150,
              animation: "vybe-grid-flicker 1.8s ease-in-out infinite",
            }}
          />
        )}
        <div style={auraStyle} />
        {!reducedMotion && <CanvasParticleRenderer pal={pal} budget={effect.particleBudget} phase={phase} />}
        <Gift3DObject effect={effect} pal={pal} reducedMotion={reducedMotion} />
        <div style={labelStyle}>
          {isBanner && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "7px",
            }}>
              <span style={{
                padding: "2px 11px",
                borderRadius: "10px",
                background: pal.primary + "22",
                border: "1px solid " + pal.primary + "55",
                color: pal.primary,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}>{isCinematic ? "CINEMATIC" : "PLATFORM"}</span>
            </div>
          )}
          <div>{headline}</div>
          {typo.subline && (
            <div style={{
              marginTop: "5px",
              color: pal.secondary || pal.primary,
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              opacity: 0.78,
              textTransform: "uppercase",
            }}>{typo.subline}</div>
          )}
          <div style={metaStyle}>
            <span>{effect.audienceScope === "platform" ? "platform moment" : "room moment"}</span>
            {typo.showSparkCount && <span>{effect.sparkCost.toLocaleString()} sparks</span>}
          </div>
        </div>
        {queueLength > 0 && (
          <div style={{
            marginTop: "12px",
            padding: "4px 14px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(255,255,255,0.52)",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            pointerEvents: "none",
          }}>+{queueLength} more gift{queueLength > 1 ? "s" : ""}</div>
        )}
      </div>
    </>
  );
}

function Gift3DObject({ effect, pal, reducedMotion }) {
  const kind = effect.objectKind || effect.id;
  const isKey = effect.id === "private_key";
  const isChamp = kind === "champagne" || kind === "champagne_pour";
  // Center-stage sizing: larger than the old corner widget
  const objPx = isKey || isChamp ? "min(230px, 44vmin)" : "min(200px, 38vmin)";

  const objectStyle = {
    position: "relative",
    width: objPx,
    height: objPx,
    transformStyle: "preserve-3d",
    animation: reducedMotion ? "none" : (effect.id === "crown_drop"
      ? "vybe-gift-crown-drop 960ms cubic-bezier(0.16,1,0.3,1) both, vybe-gift-orbit 2.8s ease-in-out 960ms infinite"
      : "vybe-gift-orbit 2.8s ease-in-out infinite"),
    filter: "drop-shadow(0 28px 44px rgba(0,0,0,0.64)) drop-shadow(0 0 36px " + (pal.glow || pal.primary + "66") + ")",
    flexShrink: 0,
  };

  const ringStyle = {
    position: "absolute",
    left: "50%",
    top: "56%",
    width: "130%",
    height: "32%",
    borderRadius: "50%",
    border: "1px solid " + pal.primary + "66",
    boxShadow: "0 0 36px " + (pal.glow || pal.primary + "44"),
    animation: reducedMotion ? "none" : "vybe-gift-ring 2.0s ease-out infinite",
  };

  return (
    <div style={{ position: "relative", width: objPx, height: objPx, flexShrink: 0 }}>
      <div style={ringStyle} />
      <div style={objectStyle}>
        <GiftObjectMesh kind={kind} pal={pal} />
      </div>
    </div>
  );
}

function GiftObjectMesh({ kind, pal }) {
  if (kind === "key" || kind === "private_key") return <KeyMesh pal={pal} />;
  if (kind === "champagne" || kind === "champagne_pour") return <ChampagneMesh pal={pal} />;
  if (kind === "diamond" || kind === "diamond_rain") return <DiamondMesh pal={pal} />;
  if (kind === "rose" || kind === "neon_rose") return <RoseMesh pal={pal} />;
  if (kind === "flame" || kind === "fire_shot") return <FlameMesh pal={pal} />;
  if (kind === "silk" || kind === "velvet_kiss") return <SilkMesh pal={pal} />;
  return <CrownMesh pal={pal} />;
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

function ChampagneMesh({ pal }) {
  return (
    <svg viewBox="0 0 220 190" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="vybeChampGlass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="0.28" stopColor={pal.secondary || "#fff6d6"} stopOpacity="0.65" />
          <stop offset="0.72" stopColor={pal.primary} stopOpacity="0.48" />
          <stop offset="1" stopColor="#7a5117" stopOpacity="0.74" />
        </linearGradient>
        <linearGradient id="vybeChampLiquid" x1="0" x2="1">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset="0.48" stopColor={pal.primary} />
          <stop offset="1" stopColor="#b67b18" />
        </linearGradient>
        <linearGradient id="vybeBottle" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="0.2" stopColor="#244e35" />
          <stop offset="0.72" stopColor="#0b1c15" />
          <stop offset="1" stopColor="#050907" />
        </linearGradient>
      </defs>
      <g transform="translate(20,34) rotate(-18 55 70)" opacity="0.95">
        <path d="M50 0 L75 0 L71 72 C82 81 88 104 81 126 C73 149 32 149 24 126 C17 104 23 81 34 72 Z" fill="url(#vybeBottle)" stroke="rgba(255,255,255,.38)" strokeWidth="2" />
        <rect x="50" y="0" width="25" height="26" rx="5" fill={pal.primary} opacity="0.8" />
        <path d="M40 76 C55 86 67 86 80 76" fill="none" stroke="#fff" strokeWidth="3" opacity="0.22" />
        <path d="M33 95 C51 105 67 105 81 95" fill="none" stroke="#fff" strokeWidth="2" opacity="0.16" />
      </g>
      <path d="M65 42 C68 96 80 120 102 124 L102 158 L78 166 L142 166 L118 158 L118 124 C140 120 152 96 155 42 Z" fill="rgba(255,255,255,.11)" stroke="rgba(255,255,255,.55)" strokeWidth="3" />
      <path d="M73 72 C80 93 91 103 110 104 C129 103 140 93 147 72 C132 80 88 80 73 72 Z" fill="url(#vybeChampLiquid)" opacity="0.9" />
      <ellipse cx="110" cy="42" rx="45" ry="10" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.7)" strokeWidth="2" />
      <path d="M61 46 C78 58 142 58 159 46" fill="none" stroke="#fff" strokeWidth="3" opacity="0.48" />
      <g opacity="0.9">
        {[74,91,113,132,148].map((x, i) => <circle key={i} cx={x} cy={26 - (i % 2) * 7} r={4 + (i % 2)} fill={pal.secondary || "#fff6d6"} />)}
      </g>
      <path d="M42 48 C76 14 124 8 188 34" fill="none" stroke={pal.primary} strokeWidth="5" strokeLinecap="round" opacity="0.48" />
      <path d="M47 58 C88 34 132 30 190 52" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M82 29 C112 8 146 7 182 19" fill="none" stroke="#fff6d6" strokeWidth="2" strokeLinecap="round" opacity="0.34" />
    </svg>
  );
}

function DiamondMesh({ pal }) {
  return (
    <svg viewBox="0 0 180 180" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="vybeDiamondDeep" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.28" stopColor={pal.secondary || "#dff8ff"} />
          <stop offset="0.72" stopColor={pal.primary} />
          <stop offset="1" stopColor="#246b83" />
        </linearGradient>
      </defs>
      <polygon points="90,16 153,61 90,164 27,61" fill="url(#vybeDiamondDeep)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" opacity="0.96" />
      <polyline points="27,61 90,84 153,61" fill="none" stroke="#fff" strokeWidth="2" opacity="0.56" />
      <polyline points="54,61 90,164 126,61" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.34" />
      <polygon points="90,16 54,61 90,84 126,61" fill="#fff" opacity="0.16" />
      <ellipse cx="90" cy="166" rx="44" ry="8" fill={pal.primary} opacity="0.12" />
    </svg>
  );
}

function RoseMesh({ pal }) {
  return (
    <svg viewBox="0 0 140 160" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="vybeRosePetal" cx="42%" cy="30%" r="70%">
          <stop offset="0" stopColor="#ffd3e2" />
          <stop offset="0.44" stopColor={pal.primary} />
          <stop offset="1" stopColor="#7a1037" />
        </radialGradient>
        <linearGradient id="vybeRoseStem" x1="0" x2="1">
          <stop offset="0" stopColor="#0d6f4a" />
          <stop offset="1" stopColor="#6fffc0" />
        </linearGradient>
      </defs>
      <path d="M70 74 C67 102 65 126 62 148" fill="none" stroke="url(#vybeRoseStem)" strokeWidth="7" strokeLinecap="round" />
      <path d="M67 112 C46 103 34 118 27 132 C48 134 59 127 67 112 Z" fill="#36d78f" opacity="0.55" />
      <path d="M73 103 C94 92 109 103 118 116 C98 121 82 116 73 103 Z" fill="#36d78f" opacity="0.42" />
      <path d="M70 22 C50 25 31 42 34 62 C38 88 62 94 81 80 C107 60 98 21 70 22 Z" fill="url(#vybeRosePetal)" stroke="#ffd2e1" strokeWidth="2" />
      <path d="M66 35 C47 42 48 67 67 71 C86 75 96 56 84 42 C78 35 72 33 66 35 Z" fill="#ff7eb1" opacity="0.72" />
      <path d="M78 42 C62 43 58 59 70 64 C81 69 89 57 78 42 Z" fill="#fff" opacity="0.22" />
    </svg>
  );
}

function FlameMesh({ pal }) {
  return (
    <svg viewBox="0 0 150 170" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="vybeFlameOuter" cx="42%" cy="36%" r="72%">
          <stop offset="0" stopColor="#fff4b8" />
          <stop offset="0.38" stopColor={pal.primary} />
          <stop offset="1" stopColor="#8b1d00" />
        </radialGradient>
      </defs>
      <path d="M80 10 C86 49 38 60 42 108 C45 143 72 158 98 147 C127 135 133 103 116 75 C107 60 98 51 98 31 C86 53 75 63 70 82 C64 62 65 38 80 10 Z" fill="url(#vybeFlameOuter)" stroke="#ffd28c" strokeWidth="2" />
      <path d="M78 76 C65 93 62 123 82 133 C101 142 116 125 107 105 C101 91 88 88 92 63 C84 72 80 75 78 76 Z" fill="#fff3b0" opacity="0.78" />
      <ellipse cx="79" cy="151" rx="38" ry="9" fill={pal.primary} opacity="0.14" />
    </svg>
  );
}

function SilkMesh({ pal }) {
  return (
    <svg viewBox="0 0 180 130" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="vybeSilk" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff0f8" />
          <stop offset="0.4" stopColor={pal.primary} />
          <stop offset="1" stopColor="#5a1235" />
        </linearGradient>
      </defs>
      <path d="M18 78 C43 23 78 44 91 68 C106 39 143 22 164 78 C138 112 103 105 91 82 C76 106 43 112 18 78 Z" fill="url(#vybeSilk)" stroke="#ffd1e6" strokeWidth="2" opacity="0.94" />
      <path d="M22 78 C55 86 75 82 91 68 C107 82 131 86 160 78" fill="none" stroke="#fff" strokeWidth="3" opacity="0.38" />
      <path d="M47 64 C57 49 71 53 80 66" fill="none" stroke="#fff" strokeWidth="3" opacity="0.28" />
      <path d="M101 66 C111 52 127 50 139 64" fill="none" stroke="#fff" strokeWidth="3" opacity="0.24" />
    </svg>
  );
}

/* -----------------------------------------------------------------------
   Mid-tier: prominent center-room moment - more than a toast, less than cinematic
   ----------------------------------------------------------------------- */
function MidTierBurst({ effect, pal, typo, sender, phase, reducedMotion, queueLength = 0 }) {
  const entering = !reducedMotion && phase === "entry";
  const exiting = !reducedMotion && phase === "exit";
  const holding = !reducedMotion && phase === "hold";

  const wrapStyle = {
    position: "fixed",
    top: GIFT_STAGE_ANCHOR.top,
    right: GIFT_STAGE_ANCHOR.right,
    zIndex: 1600,
    transform: entering
      ? "translateY(12px) scale(0.78)"
      : exiting
        ? "translateY(6px) scale(0.92)"
        : "translateY(0) scale(1)",
    transition: reducedMotion
      ? "opacity 0.15s ease"
      : "opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
    opacity: entering ? 0 : exiting ? 0 : 1,
    pointerEvents: "none",
    userSelect: "none",
  };

  const cardStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 20px 11px 14px",
    borderRadius: "36px",
    background: "rgba(10,8,18,0.93)",
    border: "1px solid " + pal.primary + "88",
    boxShadow: "0 0 32px " + (pal.glow || pal.primary + "44") + ", 0 18px 52px rgba(0,0,0,0.42)",
    color: "#fff",
    fontFamily: "inherit",
    fontSize: "14px",
    letterSpacing: typo.letterSpacing || "0.06em",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    whiteSpace: "nowrap",
    overflow: "hidden",
  };

  const gemStyle = {
    flexShrink: 0,
    animation: holding
      ? "vybe-mid-gem-pulse 1.6s ease-in-out infinite"
      : "none",
  };

  const textWrap = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const senderStyle = {
    color: pal.primary,
    fontWeight: 700,
    fontSize: "13px",
  };

  const nameStyle = {
    color: "#fff",
    fontWeight: typo.weight || 600,
    fontSize: "16px",
    letterSpacing: "0.04em",
  };

  const sparkStyle = {
    color: "rgba(255,255,255,0.52)",
    fontSize: "11px",
    fontWeight: 500,
  };

  return (
    <div style={wrapStyle} role="status" aria-live="polite" aria-label={sender + " sent " + effect.displayName}>
      {queueLength > 0 && (
        <div style={{
          alignSelf: "flex-end",
          marginBottom: "4px",
          padding: "2px 10px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.44)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          pointerEvents: "none",
        }}>+{queueLength} more</div>
      )}
      <div style={cardStyle}>
        {!reducedMotion && <style>{`@keyframes vybe-mid-gem-pulse{0%,100%{filter:drop-shadow(0 0 6px ${pal.primary})}50%{filter:drop-shadow(0 0 18px ${pal.primary}) drop-shadow(0 0 36px ${pal.primary}55)}}`}</style>}
        {!reducedMotion && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "36px", pointerEvents: "none" }}>
            <CanvasParticleRenderer pal={pal} budget={effect.particleBudget} phase={phase} />
          </div>
        )}
        <div style={{ ...gemStyle, width: 54, height: 54, transformStyle: "preserve-3d" }}>
          <GiftObjectMesh kind={effect.objectKind || effect.id} pal={pal} />
        </div>
        <div style={textWrap}>
          <span style={senderStyle}>{sender}</span>
          <span style={nameStyle}>{effect.displayName}</span>
          {typo.showSparkCount && (
            <span style={sparkStyle}>{effect.sparkCost.toLocaleString()} sparks</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
   ParticleBurst - CSS-only particle system, no canvas dependency
   Budget-capped, tier-aware. Renders only during active phases.
   ----------------------------------------------------------------------- */
function ParticleBurst({ pal, budget, phase }) {
  // Particle positions are memoized on budget identity so phase transitions
  // don't snap particles to new random positions mid-animation.
  const particles = useMemo(() => {
    if (!budget) return [];
    const count = Math.min(budget.count, 24); // DOM cap
    const spread = budget.spread || "radial-tight";
    return Array.from({ length: count }, (_, i) => {
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
  }, [budget?.count, budget?.spread, budget?.maxRadius]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!budget || phase === "exit") return null;

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
