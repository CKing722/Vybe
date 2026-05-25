import { useState, useEffect, useRef } from "react";
import { GIFT_EFFECT_MAP, PLATFORM_BANNER_THRESHOLD_SPARKS } from "./giftEffectCatalog.js";

/*
  PlatformBanner
  Props:
    giftId   - string, key in GIFT_EFFECT_MAP
    sender   - string, display name of sender
    visible  - boolean, triggers the banner cycle
    onDone   - callback fired when banner dismisses
  Renders a full-width top banner strip for 500+ spark gifts.
  Does not interrupt room content below it.
*/
export default function PlatformBanner({ giftId, sender = "Someone", visible, onDone }) {
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timers = useRef([]);

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
    : sender + " sent " + effect.displayName;
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
    gap: "12px",
    padding: "10px 20px",
    background: pal.bannerBackground || "rgba(0,0,0,0.92)",
    borderBottom: "1.5px solid " + pal.primary + "66",
    boxShadow: "0 2px 32px " + (pal.glow || pal.primary + "44"),
    transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
    opacity: exiting ? 0 : 1,
    transform: exiting ? "translateY(-100%)" : "translateY(0)",
    pointerEvents: "none",
    userSelect: "none",
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
    fontSize: "clamp(0.85rem, 2.5vw, 1.05rem)",
    letterSpacing: typo.letterSpacing || "0.08em",
    textTransform: typo.casing === "uppercase" ? "uppercase" : "none",
    color: pal.primary,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    margin: 0,
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

  const dividerStyle = {
    width: "1px",
    height: "16px",
    background: pal.primary + "44",
    flexShrink: 0,
  };

  return (
    <div style={bannerStyle} role="status" aria-live="polite" aria-label={headline}>
      <span style={labelStyle}>{isCinematic ? "CINEMATIC" : "PLATFORM"}</span>
      <div style={dividerStyle} />
      <p style={headlineStyle}>{headline}</p>
      {typo.showSparkCount && (
        <>
          <div style={dividerStyle} />
          <span style={sparkStyle}>
            <span>&#9889;</span>
            <span>{effect.sparkCost.toLocaleString()}</span>
          </span>
        </>
      )}
    </div>
  );
}
