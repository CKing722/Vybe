/**
 * VYBE Gift Effect Catalog
 * Designer-editable definitions. Each entry is a pure data contract -
 * no runtime imports required. Integrate via giftEffectCatalog[id].
 *
 * Tiers: low | mid | high
 * audienceScope: sender | room | platform
 * platformWideBanner: true -> eligible for 500+ spark full-room banner overlay
 */

export const PLATFORM_BANNER_THRESHOLD_SPARKS = 500;

/** @type {GiftEffect[]} */
export const GIFT_EFFECT_CATALOG = [
  {
    id: "neon_rose",
    displayName: "Neon Rose",
    sparkCost: 5,
    tier: "low",
    durationMs: 2400,
    audienceScope: "room",
    platformWideBanner: false,

    objectKind: "rose",

    palette: {
      primary: "#FF2D78",   // hot pink
      secondary: "#FF8FBA", // blush
      glow: "#FF2D7844",    // translucent bloom
      text: "#FFFFFF",
    },

    particleBudget: {
      count: 18,
      maxRadius: 6,
      spread: "radial-tight",
      trailFade: true,
    },

    typography: {
      displayFont: "inherit",
      weight: 500,
      size: "sm",           // restrained - not dominant
      letterSpacing: "0.04em",
      casing: "none",
      showSenderLabel: true,
      showSparkCount: false,
    },

    effectPhases: [
      {
        phase: "entry",
        durationMs: 400,
        animation: "fade-rise",
        scale: 0.9,
        opacity: [0, 1],
      },
      {
        phase: "hold",
        durationMs: 1400,
        animation: "pulse-glow",
        glowIntensity: 0.4,
        particleEmit: true,
      },
      {
        phase: "exit",
        durationMs: 600,
        animation: "fade-fall",
        scale: 0.85,
        opacity: [1, 0],
      },
    ],
  },

  {
    id: "fire_shot",
    displayName: "Fire Shot",
    sparkCost: 25,
    tier: "low",
    durationMs: 2600,
    audienceScope: "room",
    platformWideBanner: false,

    objectKind: "flame",

    palette: {
      primary: "#FF6A22",
      secondary: "#FFD08A",
      glow: "#FF6A2255",
      text: "#FFFFFF",
    },

    particleBudget: {
      count: 26,
      maxRadius: 8,
      spread: "ember-rise",
      trailFade: true,
      glitterEnabled: true,
    },

    typography: {
      displayFont: "inherit",
      weight: 600,
      size: "sm",
      letterSpacing: "0.04em",
      casing: "none",
      showSenderLabel: true,
      showSparkCount: false,
    },

    effectPhases: [
      { phase: "entry", durationMs: 320, animation: "fade-rise", scale: 0.92, opacity: [0, 1] },
      { phase: "hold", durationMs: 1700, animation: "ember-waver", glowIntensity: 0.55, particleEmit: true },
      { phase: "exit", durationMs: 580, animation: "fade-fall", scale: 0.9, opacity: [1, 0] },
    ],
  },

  {
    id: "velvet_kiss",
    displayName: "Blow Kiss",
    sparkCost: 50,
    tier: "low",
    durationMs: 2800,
    audienceScope: "room",
    platformWideBanner: false,

    objectKind: "silk",

    palette: {
      primary: "#FF4D9E",
      secondary: "#FFD1E6",
      glow: "#FF4D9E55",
      text: "#FFFFFF",
    },

    particleBudget: {
      count: 30,
      maxRadius: 7,
      spread: "silk-float",
      trailFade: true,
      glitterEnabled: true,
    },

    typography: {
      displayFont: "inherit",
      weight: 600,
      size: "sm",
      letterSpacing: "0.04em",
      casing: "none",
      showSenderLabel: true,
      showSparkCount: false,
    },

    effectPhases: [
      { phase: "entry", durationMs: 340, animation: "fade-rise", scale: 0.9, opacity: [0, 1] },
      { phase: "hold", durationMs: 1800, animation: "silk-drift", glowIntensity: 0.52, particleEmit: true },
      { phase: "exit", durationMs: 660, animation: "fade-fall", scale: 0.88, opacity: [1, 0] },
    ],
  },

  {
    id: "diamond_rain",
    displayName: "Diamond Rain",
    sparkCost: 150,
    tier: "mid",
    durationMs: 3600,
    audienceScope: "room",
    platformWideBanner: false,

    objectKind: "diamond",

    palette: {
      primary: "#8BE9FF",
      secondary: "#FFFFFF",
      glow: "#8BE9FF55",
      text: "#FFFFFF",
    },

    particleBudget: {
      count: 54,
      maxRadius: 9,
      spread: "crystal-fall",
      trailFade: true,
      glitterEnabled: true,
    },

    typography: {
      displayFont: "inherit",
      weight: 600,
      size: "md",
      letterSpacing: "0.08em",
      casing: "none",
      showSenderLabel: true,
      showSparkCount: true,
    },

    effectPhases: [
      {
        phase: "entry",
        durationMs: 360,
        animation: "crystal-arrive",
        scale: 0.78,
        opacity: [0, 1],
      },
      {
        phase: "hold",
        durationMs: 2500,
        animation: "crystal-rain",
        glowIntensity: 0.7,
        particleEmit: true,
      },
      {
        phase: "exit",
        durationMs: 740,
        animation: "fade-sink",
        scale: 0.9,
        opacity: [1, 0],
      },
    ],
  },

  {
    id: "crown_drop",
    displayName: "Crown Drop",
    sparkCost: 500,
    tier: "high",
    durationMs: 6000,
    audienceScope: "room",
    platformWideBanner: true,   // 500+ spark banner eligible

    objectKind: "crown",

    palette: {
      primary: "#FFD700",   // gold
      secondary: "#FFF1A8", // pale gold shimmer
      glow: "#FFD70066",    // rich gold bloom
      text: "#1A1A1A",
      bannerBackground: "linear-gradient(135deg, #1A1200 0%, #3D2C00 50%, #1A1200 100%)",
    },

    particleBudget: {
      count: 80,
      maxRadius: 12,
      spread: "cascade-down",
      trailFade: true,
      glitterEnabled: true,
    },

    typography: {
      displayFont: "inherit",
      weight: 700,
      size: "xl",
      letterSpacing: "0.12em",
      casing: "uppercase",
      showSenderLabel: true,
      showSparkCount: true,
      bannerHeadline: "{sender} dropped a Crown",
    },

    effectPhases: [
      {
        phase: "cinematic-open",
        durationMs: 800,
        animation: "letterbox-expand",
        overlayDim: 0.7,        // dims room content behind
        scale: 1,
        opacity: [0, 1],
      },
      {
        phase: "crown-descent",
        durationMs: 1600,
        animation: "drop-bounce",
        particleEmit: true,
        cameraShake: { intensityPx: 4, durationMs: 300 },
      },
      {
        phase: "hold-glory",
        durationMs: 2400,
        animation: "pulse-radiate",
        glowIntensity: 0.85,
        particleEmit: true,
      },
      {
        phase: "exit",
        durationMs: 1200,
        animation: "fade-ascend",
        overlayDim: 0,
        opacity: [1, 0],
      },
    ],
  },

  {
    id: "champagne_pour",
    displayName: "Champagne",
    sparkCost: 2500,
    tier: "high",
    durationMs: 6400,
    audienceScope: "room",
    platformWideBanner: true,

    objectKind: "champagne",

    palette: {
      primary: "#F6D47A",
      secondary: "#FFF6D6",
      glow: "#F6D47A66",
      text: "#14100A",
      bannerBackground: "linear-gradient(135deg, #181007 0%, #4A3210 50%, #181007 100%)",
    },

    particleBudget: {
      count: 100,
      maxRadius: 10,
      spread: "champagne-spray",
      trailFade: true,
      glitterEnabled: true,
    },

    typography: {
      displayFont: "inherit",
      weight: 700,
      size: "xl",
      letterSpacing: "0.10em",
      casing: "uppercase",
      showSenderLabel: true,
      showSparkCount: true,
      bannerHeadline: "{sender} opened Champagne",
    },

    effectPhases: [
      { phase: "cinematic-open", durationMs: 520, animation: "glass-rise", overlayDim: 0.18, scale: 1, opacity: [0, 1] },
      { phase: "pour", durationMs: 1600, animation: "spray-arc", particleEmit: true, cameraShake: { intensityPx: 2, durationMs: 220 } },
      { phase: "hold-glory", durationMs: 3100, animation: "glass-shimmer", glowIntensity: 0.82, particleEmit: true },
      { phase: "exit", durationMs: 1180, animation: "fade-ascend", overlayDim: 0, opacity: [1, 0] },
    ],
  },

  {
    id: "private_key",
    displayName: "Private Key",
    sparkCost: 5000,
    tier: "high",
    durationMs: 8000,
    audienceScope: "platform",
    platformWideBanner: true,   // 500+ spark banner eligible

    objectKind: "key",

    palette: {
      primary: "#00FFB2",   // crypto mint
      secondary: "#005C40", // deep cipher green
      glow: "#00FFB255",    // neon mint bloom
      text: "#FFFFFF",
      bannerBackground: "linear-gradient(135deg, #000A06 0%, #002418 50%, #000A06 100%)",
      accentGrid: "#00FFB218", // matrix grid overlay tint
    },

    particleBudget: {
      count: 120,
      maxRadius: 10,
      spread: "matrix-fall",   // digital rain aesthetic
      trailFade: false,        // hard-edge cipher particles
      glitterEnabled: false,
      cipherGlyphs: true,      // renderer may use BTC/diamond/hash glyph particles
    },

    typography: {
      displayFont: "monospace",
      weight: 700,
      size: "2xl",
      letterSpacing: "0.18em",
      casing: "uppercase",
      showSenderLabel: true,
      showSparkCount: true,
      bannerHeadline: "{sender} unlocked the room",
      subline: "Private Key - Exclusive Access",
    },

    effectPhases: [
      {
        phase: "blackout",
        durationMs: 400,
        animation: "hard-cut-black",
        overlayDim: 0.92,
      },
      {
        phase: "cipher-reveal",
        durationMs: 1800,
        animation: "glitch-decode",
        particleEmit: true,
        glitchStrength: 0.6,
        gridOverlay: true,
      },
      {
        phase: "lock-open",
        durationMs: 1000,
        animation: "burst-radial",
        cameraShake: { intensityPx: 8, durationMs: 500 },
        particleEmit: true,
        glowIntensity: 1.0,
      },
      {
        phase: "hold-dominance",
        durationMs: 3600,
        animation: "pulse-cipher",
        particleEmit: true,
        gridOverlay: true,
      },
      {
        phase: "exit",
        durationMs: 1200,
        animation: "dissolve-pixels",
        overlayDim: 0,
        opacity: [1, 0],
      },
    ],
  },
];

/** Keyed lookup for O(1) access by gift id. */
export const GIFT_EFFECT_MAP = Object.fromEntries(
  GIFT_EFFECT_CATALOG.map((g) => [g.id, g])
);

/**
 * Returns gifts eligible for the platform-wide 500+ spark banner.
 * @returns {GiftEffect[]}
 */
export function getPlatformBannerGifts() {
  return GIFT_EFFECT_CATALOG.filter((g) => g.platformWideBanner);
}

/**
 * Returns the highest-cost catalog effect whose sparkCost is <= the given amount.
 * Falls back to the lowest-cost catalog entry if none match.
 * Useful for mapping arbitrary spark amounts to the correct spectacle tier.
 * @param {number} sparks
 * @returns {GiftEffect}
 */
export function getEffectForCost(sparks) {
  const sorted = [...GIFT_EFFECT_CATALOG].sort((a, b) => a.sparkCost - b.sparkCost);
  let best = sorted[0];
  for (const g of sorted) {
    if (g.sparkCost <= sparks) best = g;
  }
  return best;
}

/**
 * @typedef {Object} ParticleBudget
 * @property {number} count
 * @property {number} maxRadius
 * @property {string} spread
 * @property {boolean} trailFade
 * @property {boolean} [glitterEnabled]
 * @property {boolean} [cipherGlyphs]
 */

/**
 * @typedef {Object} EffectPhase
 * @property {string} phase
 * @property {number} durationMs
 * @property {string} animation
 * @property {number} [overlayDim]
 * @property {number} [glowIntensity]
 * @property {boolean} [particleEmit]
 * @property {boolean} [gridOverlay]
 * @property {number[]} [opacity]
 * @property {number} [scale]
 * @property {{ intensityPx: number, durationMs: number }} [cameraShake]
 */

/**
 * @typedef {Object} GiftEffect
 * @property {string} id
 * @property {string} displayName
 * @property {number} sparkCost
 * @property {"low"|"mid"|"high"} tier
 * @property {number} durationMs
 * @property {"sender"|"room"|"platform"} audienceScope
 * @property {boolean} platformWideBanner
 * @property {"rose"|"flame"|"silk"|"diamond"|"crown"|"champagne"|"key"} [objectKind]
 * @property {Record<string, string>} palette
 * @property {ParticleBudget} particleBudget
 * @property {Record<string, unknown>} typography
 * @property {EffectPhase[]} effectPhases
 */
