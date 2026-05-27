import { useState, useEffect, useRef } from "react";
import { GIFT_EFFECT_MAP } from "./giftEffectCatalog.js";

/*
  useGiftCombo
  Detects when the same gift type arrives multiple times within a rolling
  window and returns a combo descriptor for visual streak indicators.

  Props (object):
    events   - array of { id, giftId, sender, timestamp } newest-first
    windowMs - rolling time window in ms (default 6000)
    minCombo - minimum repeat count before comboActive is true (default 2)

  Returns:
    comboActive  - boolean
    comboCount   - number of same-type gifts in window
    comboGiftId  - string|null
    comboTier    - "low"|"mid"|"high"|null
*/
export default function useGiftCombo({
  events = [],
  windowMs = 6000,
  minCombo = 2,
} = {}) {
  const [state, setState] = useState({
    comboActive: false,
    comboCount: 0,
    comboGiftId: null,
    comboTier: null,
  });
  const expiryRef = useRef(null);

  useEffect(() => {
    const now = Date.now();
    const inWindow = events.filter(
      (e) => now - (e.timestamp || now) < windowMs
    );

    if (!inWindow.length) {
      setState({ comboActive: false, comboCount: 0, comboGiftId: null, comboTier: null });
      return;
    }

    const counts = {};
    for (const e of inWindow) {
      if (e.giftId) counts[e.giftId] = (counts[e.giftId] || 0) + 1;
    }

    const topId = Object.keys(counts).reduce((a, b) =>
      counts[a] >= counts[b] ? a : b
    );
    const count = counts[topId] || 0;
    const effect = GIFT_EFFECT_MAP[topId];

    const next = {
      comboActive: count >= minCombo,
      comboCount: count,
      comboGiftId: topId,
      comboTier: effect?.tier || null,
    };
    setState(next);

    if (expiryRef.current) clearTimeout(expiryRef.current);
    if (next.comboActive) {
      expiryRef.current = setTimeout(() => {
        setState({ comboActive: false, comboCount: 0, comboGiftId: null, comboTier: null });
      }, windowMs);
    }
  }, [events, windowMs, minCombo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { clearTimeout(expiryRef.current); }, []);

  return state;
}
