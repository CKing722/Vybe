import { useState } from "react";
import { GIFT_EFFECT_CATALOG } from "./giftEffectCatalog.js";

const TIER_DOT = { low: "#ff2d78", mid: "#ffab00", high: "#ffd700" };

/*
  GiftEffectPreviewControls
  Props:
    onPreview(giftId) - called when designer clicks a catalog entry
  Renders a floating bottom-center panel for quickly firing any catalog gift.
  Dev/designer tool - not part of the live room production UI path.
*/
export default function GiftEffectPreviewControls({ onPreview }) {
  const [open, setOpen] = useState(false);

  const panelStyle = {
    background: "rgba(14,10,22,0.96)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "228px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.65)",
  };

  const labelStyle = {
    fontSize: "10px",
    letterSpacing: "0.13em",
    color: "#666",
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: "2px",
  };

  const rowBase = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid transparent",
    background: "rgba(255,255,255,0.04)",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "background 0.14s, border-color 0.14s",
  };

  const toggleStyle = {
    padding: "7px 18px",
    borderRadius: "20px",
    border: "1px solid #ff2d7888",
    background: "rgba(20,14,28,0.92)",
    color: "#ff2d78",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.10em",
    cursor: "pointer",
    userSelect: "none",
  };

  function handleRowEnter(e) {
    e.currentTarget.style.background = "rgba(255,255,255,0.09)";
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
  }
  function handleRowLeave(e) {
    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
    e.currentTarget.style.borderColor = "transparent";
  }

  function handlePick(id) {
    setOpen(false);
    onPreview(id);
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 4001,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      pointerEvents: "auto",
    }}>
      {open && (
        <div style={panelStyle}>
          <div style={labelStyle}>Gift Effect Preview</div>
          {GIFT_EFFECT_CATALOG.map(g => {
            const dot = TIER_DOT[g.tier] || "#aaa";
            return (
              <button
                key={g.id}
                onClick={() => handlePick(g.id)}
                onMouseEnter={handleRowEnter}
                onMouseLeave={handleRowLeave}
                style={{ ...rowBase, borderColor: dot + "28" }}
                aria-label={"Preview " + g.displayName}
              >
                <span style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: dot,
                  boxShadow: "0 0 6px " + dot,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>{g.displayName}</div>
                  <div style={{ color: dot, fontSize: "11px", opacity: 0.82 }}>
                    {g.sparkCost.toLocaleString()} sparks
                    {g.platformWideBanner && (
                      <span style={{ marginLeft: "6px", color: "#888", fontSize: "10px", letterSpacing: "0.06em" }}>banner</span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                  {g.tier}
                </span>
              </button>
            );
          })}
          <div style={{ marginTop: "4px", display: "flex", gap: "6px" }}>
            {GIFT_EFFECT_CATALOG.map(g => (
              <span
                key={g.id}
                title={g.palette.primary + " / " + g.palette.secondary}
                style={{
                  flex: 1,
                  height: "4px",
                  borderRadius: "2px",
                  background: "linear-gradient(90deg, " + g.palette.primary + ", " + (g.palette.secondary || g.palette.primary) + ")",
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(p => !p)}
        style={toggleStyle}
        aria-expanded={open}
        aria-label="Toggle gift effect preview panel"
      >
        {open ? "Close Preview" : "Gift Preview"}
      </button>
    </div>
  );
}
