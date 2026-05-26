import { useEffect, useRef, useState } from "react";
import { GIFT_EFFECT_CATALOG } from "./giftEffectCatalog.js";

// Map canonical catalog entries to the shape used by this preview component.
const giftCatalog = GIFT_EFFECT_CATALOG.map((g) => ({
  id: g.id,
  name: g.displayName,
  sparks: g.sparkCost,
  tone: g.palette.primary,
}));

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
            <div style={styles.roomMeta}>342 watching - Velvet Suite</div>
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
            <span style={styles.cardLabel}>Gift Shelf</span>
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
        <strong>{gift.name}</strong>
        <span style={{ color: gift.tone }}>{gift.sparks.toLocaleString()} sparks</span>
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
  const cy = h / 2 + 9;
  const ringPulse = 0.9 + Math.sin(t * 2.2) * 0.06;
  const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, w * 0.38);
  glow.addColorStop(0, tone + "34");
  glow.addColorStop(0.42, tone + "10");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.38, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tone + "62";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.24, w * 0.22 * ringPulse, h * 0.04 * ringPulse, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawObject(ctx, w, h, gift, t) {
  if (gift.id === "private_key") return drawKey(ctx, w, h, gift.tone, t);
  if (gift.id === "neon_rose") return drawRose(ctx, w, h, gift.tone, t);
  if (gift.id === "fire_shot") return drawFlame(ctx, w, h, gift.tone, t);
  if (gift.id === "velvet_kiss") return drawSilk(ctx, w, h, gift.tone, t);
  if (gift.id === "diamond_rain") return drawDiamond(ctx, w, h, gift.tone, t);
  if (gift.id === "champagne_pour") return drawChampagne(ctx, w, h, gift.tone, t);
  return drawCrown(ctx, w, h, gift.tone, t);
}

function drawCrown(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 2) * 3;
  const scale = Math.min(w, h) / 128;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(Math.sin(t * 1.5) * 0.035);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 18;

  const shadow = ctx.createRadialGradient(0, 30, 4, 0, 30, 54);
  shadow.addColorStop(0, "rgba(0,0,0,.36)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, 32, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const crownFill = ctx.createLinearGradient(-42, -38, 42, 32);
  crownFill.addColorStop(0, "#fff7bf");
  crownFill.addColorStop(0.28, tone);
  crownFill.addColorStop(0.62, "#d0931c");
  crownFill.addColorStop(1, "#6d4309");
  ctx.beginPath();
  ctx.moveTo(-45, 18);
  ctx.lineTo(-34, -18);
  ctx.lineTo(-13, 6);
  ctx.lineTo(0, -35);
  ctx.lineTo(14, 6);
  ctx.lineTo(35, -18);
  ctx.lineTo(45, 18);
  ctx.quadraticCurveTo(18, 29, -45, 18);
  ctx.closePath();
  ctx.fillStyle = crownFill;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,248,214,.92)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const baseFill = ctx.createLinearGradient(-46, 12, 46, 34);
  baseFill.addColorStop(0, "#fff2aa");
  baseFill.addColorStop(0.45, tone);
  baseFill.addColorStop(1, "#7b4d0c");
  ctx.shadowBlur = 20;
  roundRect(ctx, -47, 10, 94, 24, 8, baseFill, "rgba(255,248,214,.86)");

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#fff9cf";
  ctx.beginPath();
  ctx.ellipse(-19, -3, 7, 26, -0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  [-34, 0, 35].forEach((x, index) => {
    const y = index === 1 ? -36 : -19;
    ctx.fillStyle = index === 1 ? "#fff8d6" : "#fff2a8";
    ctx.beginPath();
    ctx.arc(x, y, index === 1 ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = "rgba(255,255,255,.64)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-38, 20);
  ctx.quadraticCurveTo(0, 27, 40, 20);
  ctx.stroke();
  ctx.restore();
}

function drawKey(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 2.2) * 4;
  const scale = Math.min(w, h) / 150;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
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
  const scale = Math.min(w, h) / 150;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
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

function drawFlame(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 2.4) * 3;
  const scale = Math.min(w, h) / 148;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 26;

  const outer = ctx.createRadialGradient(0, -14, 4, 0, 10, 58);
  outer.addColorStop(0, "#fff9d0");
  outer.addColorStop(0.36, tone);
  outer.addColorStop(1, "#8b1d00");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.moveTo(0, -58);
  ctx.bezierCurveTo(24, -18, 44, 2, 38, 38);
  ctx.bezierCurveTo(30, 62, -30, 62, -38, 38);
  ctx.bezierCurveTo(-44, 2, -24, -18, 0, -58);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "#fff8c2";
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.bezierCurveTo(12, 2, 16, 22, 8, 42);
  ctx.bezierCurveTo(2, 56, -2, 56, -8, 42);
  ctx.bezierCurveTo(-16, 22, -12, 2, 0, -28);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // ground glow
  ctx.shadowBlur = 0;
  ctx.fillStyle = tone + "28";
  ctx.beginPath();
  ctx.ellipse(0, 64, 34, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSilk(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 1.8) * 4;
  const scale = Math.min(w, h) / 140;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 20;

  const fill = ctx.createLinearGradient(-62, -28, 62, 28);
  fill.addColorStop(0, "#fff0f8");
  fill.addColorStop(0.42, tone);
  fill.addColorStop(1, "#5a1235");

  // ribbon body
  ctx.beginPath();
  ctx.moveTo(-64, -10);
  ctx.bezierCurveTo(-44, -42, -6, -36, 0, -4);
  ctx.bezierCurveTo(6, 24, 46, 32, 64, -2);
  ctx.bezierCurveTo(44, 48, 6, 40, 0, 12);
  ctx.bezierCurveTo(-6, -16, -46, -26, -64, 12);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#ffd1e6";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // highlight sheen
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-50, -8);
  ctx.bezierCurveTo(-24, -28, 18, -22, 42, -4);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawDiamond(ctx, w, h, tone, t) {
  const cx = w / 2;
  const cy = h / 2 + Math.sin(t * 2) * 3;
  const scale = Math.min(w, h) / 138;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(Math.sin(t * 1.3) * 0.03);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 28;

  const gem = ctx.createLinearGradient(-44, -52, 44, 52);
  gem.addColorStop(0, "#ffffff");
  gem.addColorStop(0.26, tone);
  gem.addColorStop(0.72, "#dff8ff");
  gem.addColorStop(1, "#246b83");

  // girdle (top cap)
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.lineTo(-22, -52);
  ctx.lineTo(22, -52);
  ctx.lineTo(44, 0);
  ctx.closePath();
  ctx.fillStyle = gem;
  ctx.fill();

  // pavilion (bottom)
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.lineTo(0, 60);
  ctx.lineTo(44, 0);
  ctx.closePath();
  ctx.fillStyle = gem;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;

  // facet lines
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(-44, 0); ctx.lineTo(44, 0);
  ctx.moveTo(0, -52); ctx.lineTo(0, 60);
  ctx.moveTo(-22, -52); ctx.lineTo(0, 0);
  ctx.moveTo(22, -52); ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ground shadow
  ctx.shadowBlur = 0;
  ctx.fillStyle = tone + "22";
  ctx.beginPath();
  ctx.ellipse(0, 66, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawChampagne(ctx, w, h, tone, t) {
  const cx = w / 2 - 8;
  const cy = h / 2 + Math.sin(t * 1.6) * 3;
  const scale = Math.min(w, h) / 155;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(-0.14 + Math.sin(t * 1.2) * 0.025);
  ctx.shadowColor = tone;
  ctx.shadowBlur = 22;

  // bottle body
  const bottle = ctx.createLinearGradient(-22, -70, 22, 56);
  bottle.addColorStop(0, "rgba(255,255,255,.72)");
  bottle.addColorStop(0.18, "#244e35");
  bottle.addColorStop(0.72, "#0b1c15");
  bottle.addColorStop(1, "#050907");
  ctx.beginPath();
  ctx.moveTo(-14, -70);
  ctx.lineTo(-14, -22);
  ctx.bezierCurveTo(-26, -10, -26, 36, -20, 56);
  ctx.lineTo(20, 56);
  ctx.bezierCurveTo(26, 36, 26, -10, 14, -22);
  ctx.lineTo(14, -70);
  ctx.closePath();
  ctx.fillStyle = bottle;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // foil cap
  ctx.fillStyle = tone;
  ctx.globalAlpha = 0.88;
  ctx.fillRect(-14, -70, 28, 22);
  ctx.globalAlpha = 1;

  // label band
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(-20, 2, 40, 20);

  // bubbles rising
  const bubbleCount = 5;
  for (let i = 0; i < bubbleCount; i++) {
    const bx = -8 + i * 4;
    const phase = (t * 1.4 + i * 0.4) % 1;
    const by = 40 - phase * 90;
    ctx.globalAlpha = 0.55 * (1 - phase);
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.arc(bx, by, 2.5 - phase * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ground shadow
  ctx.shadowBlur = 0;
  ctx.fillStyle = tone + "20";
  ctx.beginPath();
  ctx.ellipse(0, 62, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();

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
  from { opacity: 0; transform: translateY(12px) scale(.84); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes giftIdle {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-5px) rotate(1deg); }
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
    top: 68px !important;
    width: calc(100vw - 20px) !important;
    min-height: auto !important;
    grid-template-columns: auto minmax(0, 1fr) auto !important;
    gap: 8px !important;
    padding: 8px 10px !important;
  }
  .luxury-banner-copy {
    min-width: 0 !important;
    font-size: 11px !important;
    line-height: 1 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .luxury-banner-badge {
    padding: 4px 7px !important;
    font-size: 9px !important;
  }
  .luxury-banner-join {
    display: none !important;
  }
  .luxury-banner-sparks {
    font-size: 10px !important;
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
    top: 20% !important;
    right: 16px !important;
    width: min(76px, 22vw) !important;
    height: min(76px, 22vw) !important;
  }
  .luxury-gift-moment > div {
    display: none !important;
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
    top: 72,
    left: "50%",
    zIndex: 20,
    width: "min(780px, calc(100vw - 32px))",
    minHeight: 42,
    display: "grid",
    gridTemplateColumns: "auto minmax(0,1fr) auto auto",
    alignItems: "center",
    gap: 12,
    padding: "8px 14px",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 999,
    background: "linear-gradient(90deg, rgba(6,7,12,.94), rgba(22,17,9,.9), rgba(6,7,12,.94))",
    backdropFilter: "blur(18px)",
    animation: "bannerIn .44s cubic-bezier(.16,1,.3,1) both",
  },
  bannerBadge: {
    padding: "4px 9px",
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
    background: "linear-gradient(180deg, #182033, #080912 72%)",
    boxShadow: "0 40px 120px rgba(0,0,0,.46), inset 0 0 80px rgba(255,255,255,.03)",
  },
  videoTexture: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 18%, rgba(255,215,150,0.24), transparent 11%), radial-gradient(circle at 50% 68%, rgba(255,45,120,0.2), transparent 34%), linear-gradient(105deg, transparent 0 44%, rgba(255,255,255,0.035) 45% 47%, transparent 48% 100%)",
    animation: "stageBreath 5s ease-in-out infinite",
  },
  performerSilhouette: {
    position: "absolute",
    left: "50%",
    bottom: 48,
    width: "31%",
    height: "58%",
    transform: "translateX(-50%)",
    borderRadius: "46% 46% 24% 24%",
    background: "linear-gradient(180deg, rgba(255,84,145,.62), rgba(113,72,210,.52) 66%, rgba(12,14,28,.16))",
    boxShadow: "0 0 110px rgba(255,45,120,.2)",
    overflow: "visible",
  },
  keyLight: {
    position: "absolute",
    left: "50%",
    top: "-66px",
    width: 76,
    height: 76,
    transform: "translateX(-50%)",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255,222,192,.92), rgba(171,116,86,.86))",
    boxShadow: "0 18px 58px rgba(255,210,166,.18)",
  },
  hairLight: {
    position: "absolute",
    left: "50%",
    top: "-76px",
    width: 98,
    height: 102,
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
    right: "9%",
    top: "20%",
    width: 96,
    height: 96,
    animation: "giftIn .42s cubic-bezier(.16,1,.3,1) both, giftIdle 2.8s ease-in-out .42s infinite",
  },
  giftCanvas: { width: "100%", height: "100%" },
  giftCaption: {
    position: "absolute",
    right: 0,
    bottom: -6,
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "max-content",
    maxWidth: "190px",
    padding: "6px 9px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(5,7,13,.8)",
    color: "#fff",
    textAlign: "center",
    fontSize: 10,
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
