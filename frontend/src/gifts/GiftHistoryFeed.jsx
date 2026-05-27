import { useState, useEffect, useRef } from "react";
import { GIFT_EFFECT_MAP } from "./giftEffectCatalog.js";
import useReducedMotion from "./useReducedMotion.js";

const TIER_COLOR = { low: "#ff2d78", mid: "#ffab00", high: "#ffd700" };
const MAX_VISIBLE = 6;

/*
  GiftHistoryFeed
  Persistent corner panel showing the last MAX_VISIBLE gifts received in a room session.
  Complements SparkStormShell (storm = burst mode; history = persistent log).

  Props:
    events - array of { id, giftId, sender, timestamp }, newest-first
    maxItems - override MAX_VISIBLE cap (default 6)

  Collapses to nothing when there are no events.
  Uses data from giftEffectCatalog - no runtime fetches.
*/
export default function GiftHistoryFeed({ events = [], maxItems = MAX_VISIBLE }) {
  const reducedMotion = useReducedMotion();
  const [entries, setEntries] = useState([]);
  const seenIds = useRef(new Set());

  useEffect(() => {
    if (!events.length) return;
    setEntries((prev) => {
      const next = [...prev];
      for (const ev of [...events].reverse()) {
        const key = ev.id || (ev.giftId + "_" + ev.sender + "_" + ev.timestamp);
        if (!seenIds.current.has(key)) {
          seenIds.current.add(key);
          const effect = ev.giftId ? GIFT_EFFECT_MAP[ev.giftId] : null;
          if (effect) {
            next.unshift({ key, effect, sender: ev.sender || "Someone" });
          }
        }
      }
      return next.slice(0, maxItems);
    });
  }, [events, maxItems]);

  if (!entries.length) return null;

  const panelStyle = {
    position: "fixed",
    left: "12px",
    bottom: "80px",
    zIndex: 1500,
    width: "min(224px, 88vw)",
    background: "rgba(10,8,18,0.88)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 12px 36px rgba(0,0,0,0.46)",
    pointerEvents: "none",
    userSelect: "none",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px 6px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  };

  const headerLabelStyle = {
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.32)",
  };

  return (
    <div style={panelStyle} aria-live="polite" role="log" aria-label="Recent gifts">
      {!reducedMotion && (
        <style>{`
          @keyframes vybe-feed-slide {
            from { opacity: 0; transform: translateX(-10px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      )}
      <div style={headerStyle}>
        <span style={{ fontSize: "10px", opacity: 0.45 }}>&#9889;</span>
        <span style={headerLabelStyle}>Recent Gifts</span>
      </div>
      <div style={{ padding: "4px 0 6px" }}>
        {entries.map((entry, i) => (
          <FeedRow
            key={entry.key}
            entry={entry}
            index={i}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </div>
  );
}

function FeedRow({ entry, index, reducedMotion }) {
  const { effect, sender } = entry;
  const color = TIER_COLOR[effect.tier] || "#aaa";
  const isBanner = effect.platformWideBanner;

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 12px",
    opacity: 1 - index * 0.14,
    animation: reducedMotion ? "none" : "vybe-feed-slide 0.22s " + index * 0.03 + "s ease both",
  };

  const dotStyle = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: color,
    boxShadow: "0 0 5px " + color,
    flexShrink: 0,
  };

  const senderStyle = {
    color: color,
    fontWeight: 600,
    fontSize: "11px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "70px",
    flexShrink: 0,
  };

  const giftStyle = {
    color: "rgba(255,255,255,0.78)",
    fontSize: "11px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  };

  const sparkStyle = {
    color: isBanner ? color : "rgba(255,255,255,0.34)",
    fontSize: "10px",
    fontWeight: isBanner ? 700 : 400,
    flexShrink: 0,
  };

  const costStr = effect.sparkCost >= 1000
    ? (effect.sparkCost / 1000).toFixed(effect.sparkCost % 1000 === 0 ? 0 : 1) + "k"
    : String(effect.sparkCost);

  return (
    <div style={rowStyle}>
      <div style={dotStyle} />
      <span style={senderStyle}>{sender}</span>
      <span style={giftStyle}>{effect.displayName}</span>
      <span style={sparkStyle}>&#9889;{costStr}</span>
    </div>
  );
}
