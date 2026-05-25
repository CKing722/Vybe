import { useState, useEffect, useRef, useCallback } from "react";
import { GIFT_EFFECT_MAP } from "./giftEffectCatalog.js";

/*
  SparkStormShell
  Activates when multiple gifts arrive within a rolling time window.

  Props:
    events        - array of { id, giftId, sender, timestamp } sorted newest first
    stormWindowMs - ms window to count gifts in (default 8000)
    stormThreshold- minimum gift count in window to enter storm mode (default 3)
    onStormStart  - callback when storm begins
    onStormEnd    - callback when storm cools down

  Shell is data-driven and unintegrated - pass `events` from parent state.
*/
export default function SparkStormShell({
  events = [],
  stormWindowMs = 8000,
  stormThreshold = 3,
  onStormStart,
  onStormEnd,
}) {
  const [storming, setStorming] = useState(false);
  const [intensity, setIntensity] = useState(0); // 0-1 heat scalar
  const [visibleEvents, setVisibleEvents] = useState([]);
  const cooldownTimer = useRef(null);
  const prevStorming = useRef(false);

  useEffect(() => {
    if (!events.length) return;

    const now = Date.now();
    const windowEvents = events.filter(
      (e) => now - (e.timestamp || now) < stormWindowMs
    );
    const heat = Math.min(1, windowEvents.length / (stormThreshold * 2));
    setIntensity(heat);

    const isStorming = windowEvents.length >= stormThreshold;

    if (isStorming && !prevStorming.current) {
      onStormStart && onStormStart();
    }

    setStorming(isStorming);
    prevStorming.current = isStorming;

    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    if (isStorming) {
      cooldownTimer.current = setTimeout(() => {
        setStorming(false);
        setIntensity(0);
        prevStorming.current = false;
        onStormEnd && onStormEnd();
      }, stormWindowMs);
    }

    setVisibleEvents(windowEvents.slice(0, 8));

    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, [events, stormWindowMs, stormThreshold]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!storming || !visibleEvents.length) return null;

  const heatColor = intensity > 0.7 ? "#FF4D00" : intensity > 0.4 ? "#FFB800" : "#FFD700";

  const shellStyle = {
    position: "fixed",
    bottom: "120px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1800,
    width: "min(340px, 92vw)",
    borderRadius: "14px",
    background: "rgba(10,8,0,0.92)",
    border: "1.5px solid " + heatColor + "66",
    boxShadow: "0 0 28px " + heatColor + "44, 0 0 60px " + heatColor + "18",
    overflow: "hidden",
    pointerEvents: "none",
    userSelect: "none",
    animation: "vybe-storm-enter 0.3s cubic-bezier(0.22,1,0.36,1) both",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px 6px",
    borderBottom: "1px solid " + heatColor + "33",
  };

  const stormLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: heatColor,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  };

  const heatBarTrackStyle = {
    width: "80px",
    height: "4px",
    borderRadius: "2px",
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  };

  const heatBarFillStyle = {
    height: "100%",
    borderRadius: "2px",
    width: Math.round(intensity * 100) + "%",
    background: "linear-gradient(90deg, " + heatColor + "88, " + heatColor + ")",
    transition: "width 0.4s ease",
  };

  const listStyle = {
    maxHeight: "148px",
    overflowY: "hidden",
    padding: "6px 0 8px",
  };

  return (
    <div style={shellStyle} aria-live="polite" role="status" aria-label="Spark Storm active">
      <style>{`
        @keyframes vybe-storm-enter {
          from { opacity: 0; transform: translateX(-50%) scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
        @keyframes vybe-event-slide {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div style={headerStyle}>
        <div style={stormLabelStyle}>
          <span>&#9889;</span>
          <span>Spark Storm</span>
        </div>
        <div style={heatBarTrackStyle}>
          <div style={heatBarFillStyle} />
        </div>
      </div>

      <div style={listStyle}>
        {visibleEvents.map((ev, i) => (
          <StormEventRow key={ev.id || i} event={ev} index={i} heatColor={heatColor} />
        ))}
      </div>
    </div>
  );
}

function StormEventRow({ event, index, heatColor }) {
  const effect = event.giftId ? GIFT_EFFECT_MAP[event.giftId] : null;
  const pal = effect ? effect.palette : { primary: heatColor };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 14px",
    animation: "vybe-event-slide 0.25s " + index * 0.04 + "s ease both",
  };

  const dotStyle = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: pal.primary,
    boxShadow: "0 0 5px " + pal.primary,
    flexShrink: 0,
  };

  const senderStyle = {
    color: pal.primary,
    fontWeight: 600,
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "90px",
  };

  const actionStyle = {
    color: "rgba(255,255,255,0.5)",
    fontSize: "12px",
    flexShrink: 0,
  };

  const giftStyle = {
    color: "rgba(255,255,255,0.85)",
    fontSize: "12px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flexShrink: 1,
    minWidth: 0,
  };

  const sparkStyle = {
    marginLeft: "auto",
    color: heatColor,
    fontSize: "11px",
    fontWeight: 700,
    flexShrink: 0,
  };

  return (
    <div style={rowStyle}>
      <div style={dotStyle} />
      <span style={senderStyle}>{event.sender || "Someone"}</span>
      <span style={actionStyle}>sent</span>
      <span style={giftStyle}>{effect ? effect.displayName : event.giftId}</span>
      {effect && (
        <span style={sparkStyle}>&#9889;{effect.sparkCost >= 1000
          ? (effect.sparkCost / 1000).toFixed(effect.sparkCost % 1000 === 0 ? 0 : 1) + "k"
          : effect.sparkCost}
        </span>
      )}
    </div>
  );
}
