import { useCallback } from "react";

// Vibration patterns per tier: ms on/off sequences passed to navigator.vibrate.
const PATTERNS = {
  low:  [35],                        // single soft tap
  mid:  [55, 40, 55],               // double medium tap
  high: [90, 50, 90, 50, 180],      // triple impact with final thump
};

/*
  useHapticFeedback
  Provides tier-appropriate vibration feedback on gift spectacle events.
  Uses navigator.vibrate (Vibration API) - no-ops silently on desktop or
  when the API is unavailable.

  Returns:
    fire(tier) - call with "low" | "mid" | "high" when a gift plays
*/
export default function useHapticFeedback() {
  const fire = useCallback((tier) => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    const pattern = PATTERNS[tier] || PATTERNS.low;
    try {
      navigator.vibrate(pattern);
    } catch {
      // vibrate is blocked in some browser security policies - ignore.
    }
  }, []);

  return { fire };
}
