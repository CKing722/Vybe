import { useState, useEffect, useRef } from "react";
import { GIFT_EFFECT_MAP, PLATFORM_BANNER_THRESHOLD_SPARKS } from "./giftEffectCatalog.js";
import useReducedMotion from "./useReducedMotion.js";

/*
  PlatformBanner
  Props:
    giftId   - string, key in GIFT_EFFECT_MAP
    sender   - string, display name of sender
    recipient - string, performer/room receiving the gift
    visible  - boolean, triggers the banner cycle
    onDone   - callback fired when banner dismisses
  Renders a full-width top banner strip for 500+ spark gifts.
  Does not interrupt room content below it.
*/
export default function PlatformBanner({ giftId, sender = "Someone", recipient = "this room", visible, onDone }) {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timers = useRef([]);
  const reducedMotion = useReducedMotion();

  const effect = giftId ? GIFT_EFFECT_MAP[giftId] : null;
  const eligible =
    effect &&
    effect.platformWideBanner &&
    effect.sparkCost >= PLATFORM_BANNER_THRESHOLD_SPARKS;

  useEffect(() => {
    if (!visible || !eligible) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setExiting(false);
    setShow(true);

    const holdMs = Math.min(effect.durationMs, 5000);
    const exitT = setTimeout(() => setExiting(true), holdMs);
    const doneT = setTimeout(() => {
      setShow(false);
      setExiting(false);
      onDone && onDone();
    }, holdMs + 600);

    timers.current.push(exitT, doneT);
    return () => timers.current.forEach(clearTimeout);
  }, [visible, giftId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show || !eligible) return null;

  const pal = effect.palette;
  const typo = effect.typography;
  const headline = typo.bannerHeadline
    ? typo.bannerHeadline.replace("{sender}", sender)
    : sender + " sent " + effect.displayName + " to " + recipient;
  const isCinematic = effect.sparkCost >= 5000;

  const bannerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
    rowGap: "4px",
    minHeight: "46px",
    padding: "7px 16px",
    background: pal.bannerBackground || ("linear-gradient(90deg, rgba(5,6,12,0.96), " + pal.primary + "24, rgba(5,6,12,0.96))"),
    borderBottom: "1px solid " + pal.primary + "77",
    boxShadow: "0 12px 36px rgba(0,0,0,0.38), 0 0 34px " + (pal.glow || pal.primary + "44"),
    transition: reducedMotion ? "opacity 0.15s ease" : "opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
    opacity: exiting ? 0 : 1,
    transform: reducedMotion ? "none" : (exiting ? "translateY(-100%)" : "translateY(0)"),
    animation: (!exiting && !reducedMotion) ? "vybe-banner-enter 0.5s cubic-bezier(0.22,1,0.36,1) both" : "none",
    pointerEvents: "none",
    userSelect: "none",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  };

  const labelStyle = {
    padding: "2px 10px",
    borderRadius: "10px",
    background: pal.primary + "22",
    border: "1px solid " + pal.primary + "55",
    color: pal.primary,
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    flexShrink: 0,
  };

  const headlineStyle = {
    fontFamily: typo.displayFont === "monospace" ? "monospace" : "inherit",
    fontWeight: typo.weight || 700,
    fontSize: "clamp(0.86rem, 2.4vw, 1.08rem)",
    letterSpacing: "0.03em",
    textTransform: "none",
    color: "#fff",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "clip",
    margin: 0,
    flex: "1 1 280px",
    textAlign: "center",
    minWidth: "min(330px, 76vw)",
  };

  const sparkStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: pal.secondary || pal.primary,
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
    opacity: 0.85,
  };

  const routeStyle = {
    color: pal.primary,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    flex: "0 0 auto",
    textAlign: "center",
    opacity: 0.95,
  };

  const dividerStyle = {
    width: "1px",
    height: "16px",
    background: pal.primary + "44",
    flexShrink: 0,
  };

  return (
    <div style={bannerStyle} role="status" aria-live="polite" aria-label={headline}>
      <style>{`@keyframes vybe-banner-enter{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <span style={labelStyle}>{isCinematic ? "CINEMATIC" : "PLATFORM"}</span>
      <div style={dividerStyle} />
      <p style={headlineStyle}>{headline}</p>
      <div style={dividerStyle} />
      <span style={routeStyle}>Tap to join {recipient}</span>
      {typo.showSparkCount && (
        <>
          <div style={dividerStyle} />
          <span style={sparkStyle}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: pal.secondary || pal.primary, boxShadow: "0 0 10px " + (pal.secondary || pal.primary), display: "inline-block" }} />
            <span>{effect.sparkCost.toLocaleString()}</span>
          </span>
        </>
      )}
    </div>
  );
}
