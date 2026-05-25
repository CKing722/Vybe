import { useState, useEffect } from "react";

/**
 * Returns true when the user has requested reduced motion via OS/browser settings.
 * Components should skip or simplify animations when this is true.
 */
export default function useReducedMotion() {
  const query =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  const [reduced, setReduced] = useState(query ? query.matches : false);

  useEffect(() => {
    if (!query) return;
    const handler = (e) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return reduced;
}
