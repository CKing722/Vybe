import { useEffect, useRef, useState } from "react";

const giftCatalog = [
  { id: "rose", name: "Neon Rose", sparks: 5, tone: "#ff2d78" },
  { id: "crown", name: "Crown Drop", sparks: 500, tone: "#ffd166" },
  { id: "key", name: "Private Key", sparks: 5000, tone: "#00ffb2" },
];

export default function VybeLuxuryPreview() {
  const [gift, setGift] = useState(giftCatalog[1]);
  const [pulse, setPulse] = useState(0);

  function sendGift(nextGift) {
    setGift(nextGift);
    setPulse((n) => n + 1);
  }

  return (
    <div style={styles.page}>
      <style>{css}</style>
      <div style={styles.roomGlow} />
      <TopBanner gift={gift} pulse={pulse} />
      <header className="luxury-header" style={styles.header}>
        <div style={styles.roomChip}>
          <div style={styles.livePill}>LIVE</div>
          <div>
            <div style={styles.performerName}>Luna Voss</div>
            <div style={styles.roomMeta}>342 watching · Velvet Suite</div>
          </div>
        </div>
        <div style={styles.wallet}>2,500 sparks</div>
      </header>

      <main className="luxury-stage-grid" style={styles.stageGrid}>
        <aside className="luxury-left-rail" style={styles.leftRail}>
          <div style={styles.statBlock}>
            <span style={styles.statKicker}>Spark Storm</span>
            <strong>64%</strong>
            <div style={styles.progressTrack}><i style={{ width: "64%" }} /></div>
          </div>
          <div style={styles.chatPanel}>
            <p><b>VYBE</b> Crown Drop landed in Luna's room.</p>
            <p><b>VelvetKing</b> Top of the board tonight.</p>
            <p><b>Luna</b> I see you.</p>
          </div>
        </aside>

        <section style={styles.stage}>
          <div className="luxury-video-frame" style={styles.videoFrame}>
            <div style={styles.videoTexture} />
            <div style={styles.performerSilhouette}>
              <div style={styles.keyLight} />
              <div style={styles.hairLight} />
              <div style={styles.portraitCore} />
            </div>
            <GiftMoment gift={gift} pulse={pulse} />
            <div style={styles.mediaHud}>
              <span>HD LIVE</span>
              <span>Low latency</span>
            </div>
          </div>
        </section>

        <aside className="luxury-right-rail" style={styles.rightRail}>
          <div style={styles.performerCard}>
            <span style={styles.cardLabel}>Tonight</span>
            <h2>Confessions & games</h2>
            <p>Luxury private-room energy with live gifting, games, and subscriber moments.</p>
          </div>
          <div style={styles.giftPanel}>
            <span style={styles.cardLabel}>Gift Preview</span>
            {giftCatalog.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => sendGift(item)}
                style={{
                  ...styles.giftButton,
                  borderColor: item.id === gift.id ? item.tone : "rgba(255,255,255,0.1)",
                  color: item.id === gift.id ? "#fff" : "rgba(245,240,232,0.72)",
                  boxShadow: item.id === gift.id ? "0 0 24px " + item.tone + "22" : "none",
                }}
              >
                <span style={{ ...styles.giftDot, background: item.tone, boxShadow: "0 0 16px " + item.tone }} />
                <span>{item.name}</span>
                <b>{item.sparks.toLocaleString()}</b>
              </button>
            ))}
          </div>
        </aside>
      </main>

      <nav className="luxury-toolbar" style={styles.toolbar}>
        {["Gift", "Games", "Requests", "Board", "VIP", "Top Up", "Hide"].map((label) => (
          <button key={label} type="button">{label}</button>
        ))}
      </nav>
    </div>
  );
}

function TopBanner({ gift, pulse }) {
  return (
    <div className="luxury-banner" key={gift.id + pulse} style={{ ...styles.banner, borderColor: gift.tone + "88", boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 42px " + gift.tone + "22" }}>
      <span className="luxury-banner-badge" style={{ ...styles.bannerBadge, color: gift.tone, borderColor: gift.tone + "66" }}>Platform</span>
      <strong className="luxury-banner-copy">VelvetKing sent {gift.name} to Luna Voss</strong>
      <span className="luxury-banner-join" style={{ color: gift.tone }}>Tap to join her room</span>
      <em className="luxury-banner-sparks">{gift.sparks.toLocaleString()} sparks</em>
    </div>
  );
}

function GiftMoment({ gift, pulse }) {
  return (
    <div className="luxury-gift-moment" key={gift.id + pulse} style={styles.giftMoment}>
      <GiftCanvas gift={gift} />
      <div style={{ ...styles.giftCaption, borderColor: gift.tone + "66", boxShadow: "0 18px 44px rgba(0,0,0,0.36), 0 0 34px " + gift.tone + "24" }}>
        <strong>VelvetKing sent {gift.name}</strong>
        <span style={{ color: gift.tone }}>to Luna Voss · {gift.sparks.toLocaleString()} sparks</span>
      </div>
    </div>
  );
}

function GiftCanvas({ gift }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let frame = 0;
    let raf = 0;

    function draw() {
      const w = rect.width;
      const h = rect.height;
      const t = frame / 60;
      ctx.clearRect(0, 0, w, h);
      drawAura(ctx, w, h, gift.tone, t);
      drawObject(ctx, w, h, gift, t);
      frame += 1;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [gift]);

  return <canvas ref={canvasRef} style={styles.giftCanvas} aria-hidden="true" />;
}

function drawAura(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + 12;
  const ringPulse = 0.9 + Math.sin(t * 2.2) * 0.06;
  const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, w * 0.42);
  glow.addColorStop(0, tone + "42");
  glow.addColorStop(0.42, tone + "16");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.46, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tone + "80";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 34, w * 0.3 * ringPulse, h * 0.055 * ringPulse, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawObject(ctx, w, h, gift, t) {
  if (gift.id === "key") return drawKey(ctx, w, h, gift.tone, t);
  if (gift.id === "rose") return drawRose(ctx, w, h, gift.tone, t);
  return drawCrown(ctx, w, h, gift.tone, t);
}

function drawCrown(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 2) * 5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(t * 1.5) * 0.035);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 30;
  const body = ctx.createLinearGradient(-64, -70, 68, 74);
  body.addColorStop(0, "#fff4b2");
  body.addColorStop(0.26, tone);
  body.addColorStop(0.58, "#c28a18");
  body.addColorStop(1, "#4c320a");
  ctx.beginPath();
  ctx.moveTo(0, -70);
  ctx.bezierCurveTo(48, -58, 74, -25, 66, 20);
  ctx.bezierCurveTo(58, 64, 22, 82, -18, 70);
  ctx.bezierCurveTo(-62, 56, -78, 18, -62, -22);
  ctx.bezierCurveTo(-48, -56, -18, -76, 0, -70);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "#fff3bf";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.36;
  ctx.fillStyle = "#fff9d8";
  ctx.beginPath();
  ctx.ellipse(-22, -30, 16, 34, 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#fff8cf";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-38, 12);
  ctx.lineTo(-25, -22);
  ctx.lineTo(-6, 4);
  ctx.lineTo(10, -34);
  ctx.lineTo(25, 4);
  ctx.lineTo(42, -22);
  ctx.lineTo(52, 12);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-42, 23);
  ctx.quadraticCurveTo(0, 34, 48, 23);
  ctx.stroke();
  ctx.restore();
}

function drawKey(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 2.2) * 4;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.45 + Math.sin(t * 1.4) * 0.04);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 30;
  ctx.strokeStyle = "#eafff6";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(-42, 0, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(86, 0);
  ctx.stroke();
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(54, 2);
  ctx.lineTo(54, 38);
  ctx.moveTo(78, 2);
  ctx.lineTo(78, 29);
  ctx.stroke();
  ctx.restore();
}

function drawRose(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 2) * 4;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 28;
  ctx.strokeStyle = "#ffc2d8";
  ctx.lineWidth = 3;
  const petal = ctx.createRadialGradient(0, -16, 4, 0, 0, 66);
  petal.addColorStop(0, "#ffe2ee");
  petal.addColorStop(0.45, tone);
  petal.addColorStop(1, "#7b103b");
  ctx.fillStyle = petal;
  for (let i = 0; i < 7; i += 1) {
    ctx.rotate((Math.PI * 2) / 7);
    ctx.beginPath();
    ctx.ellipse(0, -32, 18, 42, Math.sin(t) * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

const css = `
@keyframes bannerIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(.98); }
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
@keyframes giftIn {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 18px)) scale(.86); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes stageBreath {
  0%, 100% { opacity: .82; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}
button {
  color: inherit;
}
nav button {
  min-width: 66px;
  min-height: 38px;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 8px;
  background: rgba(255,255,255,.045);
  color: rgba(246,239,232,.78);
  font: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
nav button:hover {
  color: #fff;
  border-color: rgba(255,209,102,.36);
  background: rgba(255,209,102,.08);
}
@media (max-width: 980px) {
  .luxury-header {
    padding: 10px 12px !important;
  }
  .luxury-banner {
    top: 70px !important;
    width: calc(100vw - 20px) !important;
    min-height: auto !important;
    grid-template-columns: auto 1fr auto !important;
    gap: 7px !important;
    row-gap: 7px !important;
    padding: 10px 12px !important;
  }
  .luxury-banner-copy {
    grid-column: 1 / -1 !important;
    grid-row: 2 !important;
    min-width: 0 !important;
    text-align: center !important;
    font-size: 13px !important;
    line-height: 1.24 !important;
    white-space: normal !important;
  }
  .luxury-banner-badge {
    grid-column: 1 !important;
    grid-row: 1 !important;
  }
  .luxury-banner-join {
    grid-column: 2 !important;
    grid-row: 1 !important;
    text-align: center !important;
    font-size: 10px !important;
    letter-spacing: .12em !important;
  }
  .luxury-banner-sparks {
    grid-column: 3 !important;
    grid-row: 1 !important;
    font-size: 11px !important;
    white-space: nowrap !important;
  }
  .luxury-stage-grid {
    grid-template-columns: 1fr !important;
    height: calc(100vh - 126px) !important;
    padding: 108px 8px 70px !important;
  }
  .luxury-left-rail,
  .luxury-right-rail {
    display: none !important;
  }
  .luxury-video-frame {
    width: 100% !important;
    min-height: 0 !important;
    height: 100% !important;
  }
  .luxury-gift-moment {
    top: 31% !important;
    width: min(210px, 60vw) !important;
    height: min(210px, 60vw) !important;
  }
  .luxury-toolbar {
    width: calc(100vw - 14px) !important;
    justify-content: center !important;
    overflow: hidden !important;
  }
  .luxury-toolbar button {
    min-width: 48px !important;
    padding: 0 8px !important;
    font-size: 10px !important;
  }
}
`;

const styles = {
  page: {
    minHeight: "100vh",
    overflow: "hidden",
    position: "relative",
    color: "#f6efe8",
    background: "radial-gradient(circle at 50% 22%, #142033 0%, #080b14 44%, #05060a 100%)",
    fontFamily: "Sora, Inter, ui-sans-serif, system-ui, sans-serif",
  },
  roomGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 56%, rgba(255,45,120,0.18), transparent 28%), radial-gradient(circle at 72% 16%, rgba(255,209,102,0.12), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%)",
    pointerEvents: "none",
  },
  header: {
    position: "relative",
    zIndex: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
  },
  roomChip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 13px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    background: "rgba(5,7,13,0.58)",
    backdropFilter: "blur(18px)",
  },
  livePill: {
    padding: "4px 9px",
    borderRadius: 999,
    background: "#c6ff00",
    color: "#061007",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: ".08em",
  },
  performerName: { fontSize: 15, fontWeight: 900 },
  roomMeta: { marginTop: 2, color: "rgba(246,239,232,0.48)", fontSize: 11 },
  wallet: {
    padding: "8px 13px",
    borderRadius: 999,
    color: "#ffd166",
    background: "rgba(5,7,13,0.64)",
    border: "1px solid rgba(255,209,102,0.18)",
    fontWeight: 900,
    fontSize: 13,
  },
  banner: {
    position: "fixed",
    top: 74,
    left: "50%",
    zIndex: 20,
    width: "min(860px, calc(100vw - 32px))",
    minHeight: 60,
    display: "grid",
    gridTemplateColumns: "auto minmax(0,1fr) auto auto",
    alignItems: "center",
    gap: 14,
    padding: "11px 16px",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    background: "linear-gradient(90deg, rgba(6,7,12,.94), rgba(22,17,9,.9), rgba(6,7,12,.94))",
    backdropFilter: "blur(18px)",
    animation: "bannerIn .44s cubic-bezier(.16,1,.3,1) both",
  },
  bannerBadge: {
    padding: "5px 10px",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: ".14em",
    textTransform: "uppercase",
  },
  stageGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "260px minmax(420px,1fr) 300px",
    gap: 16,
    height: "calc(100vh - 138px)",
    padding: "42px 18px 86px",
  },
  leftRail: { display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 14 },
  rightRail: { display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 },
  statBlock: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    background: "rgba(8,10,17,0.58)",
    padding: 14,
    backdropFilter: "blur(14px)",
  },
  statKicker: { display: "block", color: "rgba(246,239,232,.5)", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase" },
  progressTrack: { height: 7, marginTop: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" },
  chatPanel: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    background: "rgba(8,10,17,0.54)",
    padding: 14,
    color: "rgba(246,239,232,.7)",
    fontSize: 12,
    lineHeight: 1.5,
    backdropFilter: "blur(14px)",
  },
  stage: { minWidth: 0, display: "grid", placeItems: "center" },
  videoFrame: {
    position: "relative",
    width: "min(650px, 100%)",
    height: "min(760px, 100%)",
    minHeight: 560,
    overflow: "hidden",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, #171f2e, #090912 72%)",
    boxShadow: "0 40px 120px rgba(0,0,0,.46), inset 0 0 80px rgba(255,255,255,.03)",
  },
  videoTexture: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 22%, rgba(255,215,150,0.2), transparent 10%), radial-gradient(circle at 50% 70%, rgba(255,45,120,0.23), transparent 32%), linear-gradient(105deg, transparent 0 44%, rgba(255,255,255,0.035) 45% 47%, transparent 48% 100%)",
    animation: "stageBreath 5s ease-in-out infinite",
  },
  performerSilhouette: {
    position: "absolute",
    left: "50%",
    bottom: 72,
    width: "26%",
    height: "47%",
    transform: "translateX(-50%)",
    borderRadius: "46% 46% 24% 24%",
    background: "linear-gradient(180deg, rgba(255,84,145,.58), rgba(113,72,210,.48) 64%, rgba(12,14,28,.18))",
    boxShadow: "0 0 90px rgba(255,45,120,.18)",
    overflow: "visible",
  },
  keyLight: {
    position: "absolute",
    left: "50%",
    top: "-62px",
    width: 70,
    height: 70,
    transform: "translateX(-50%)",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255,222,192,.92), rgba(171,116,86,.86))",
    boxShadow: "0 18px 58px rgba(255,210,166,.18)",
  },
  hairLight: {
    position: "absolute",
    left: "50%",
    top: "-70px",
    width: 88,
    height: 92,
    transform: "translateX(-50%)",
    borderRadius: "50% 50% 44% 44%",
    background: "radial-gradient(circle at 45% 18%, rgba(255,226,194,.22), transparent 36%), linear-gradient(135deg, rgba(70,38,28,.62), rgba(18,14,18,.42))",
    filter: "blur(.3px)",
  },
  portraitCore: {
    position: "absolute",
    inset: "10% 12% 0",
    borderRadius: "48% 48% 28% 28%",
    background: "linear-gradient(180deg, rgba(255,255,255,.08), transparent 30%), radial-gradient(circle at 50% 4%, rgba(255,210,166,.26), transparent 18%)",
  },
  mediaHud: {
    position: "absolute",
    top: 16,
    right: 16,
    display: "flex",
    gap: 8,
    color: "rgba(246,239,232,.58)",
    fontSize: 11,
    letterSpacing: ".1em",
    textTransform: "uppercase",
  },
  giftMoment: {
    position: "absolute",
    left: "50%",
    top: "27%",
    width: 210,
    height: 210,
    transform: "translate(-50%, -50%)",
    animation: "giftIn .5s cubic-bezier(.16,1,.3,1) both",
  },
  giftCanvas: { width: "100%", height: "100%" },
  giftCaption: {
    position: "absolute",
    left: "50%",
    bottom: -2,
    transform: "translateX(-50%)",
    display: "grid",
    gap: 3,
    width: "min(280px, 92vw)",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(5,7,13,.8)",
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    backdropFilter: "blur(14px)",
  },
  performerCard: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 16,
    background: "rgba(8,10,17,.56)",
    backdropFilter: "blur(14px)",
  },
  cardLabel: { color: "#ffd166", fontSize: 10, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase" },
  giftPanel: {
    display: "grid",
    gap: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 14,
    background: "rgba(8,10,17,.62)",
    backdropFilter: "blur(14px)",
  },
  giftButton: {
    minHeight: 42,
    display: "grid",
    gridTemplateColumns: "10px minmax(0,1fr) auto",
    alignItems: "center",
    gap: 10,
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 8,
    background: "rgba(255,255,255,.045)",
    font: "inherit",
    fontSize: 12,
    cursor: "pointer",
  },
  giftDot: { width: 8, height: 8, borderRadius: "50%" },
  toolbar: {
    position: "fixed",
    left: "50%",
    bottom: 14,
    zIndex: 10,
    transform: "translateX(-50%)",
    display: "flex",
    gap: 6,
    padding: 6,
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 12,
    background: "rgba(5,7,13,.72)",
    backdropFilter: "blur(18px)",
  },
};
