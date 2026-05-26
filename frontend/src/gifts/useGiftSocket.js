import { useEffect, useRef, useCallback } from "react";
import { GIFT_EFFECT_MAP } from "./giftEffectCatalog.js";

// Maps backend gift_type_id values to catalog ids.
// Backend uses short slugs ("crown"); catalog uses full ids ("crown_drop").
const BACKEND_ID_MAP = {
  neon_rose: "neon_rose",
  fire_shot: "fire_shot",
  velvet_kiss: "velvet_kiss",
  velvet_spark: "velvet_kiss",
  diamond_rain: "diamond_rain",
  crown: "crown_drop",
  crown_drop: "crown_drop",
  champagne: "champagne_pour",
  champagne_pour: "champagne_pour",
  private_key: "private_key",
};

function resolveGiftId(backendId) {
  return BACKEND_ID_MAP[backendId] || backendId;
}

function httpToWs(url) {
  return url.replace(/^http(s?):\/\//, (_, s) => "ws" + s + "://");
}

const DEFAULT_BASE = "http://localhost:4000";

/*
  useGiftSocket
  Connects to the VYBE backend WebSocket room channel and translates server
  events into catalog-aware callbacks. Reconnects automatically on drop.
  Gracefully no-ops when roomId is absent (lobby, unauthenticated).

  Props (object):
    roomId            - backend room UUID; pass null/undefined when not in a room
    token             - bearer token from auth (optional; omit in guest mode)
    onGiftAnimation   - ({ giftId, sender, recipient, timestamp }) -> void
    onSparkStormEvent - ({ type, payload }) -> void; type is one of:
                        spark_storm_start | spark_storm_update | spark_storm_complete
    baseUrl           - backend base URL (default: http://localhost:4000)

  Returns:
    sendGift({ performerId, giftTypeId, roomId?, token? }) -> Promise<object|null>
*/
export default function useGiftSocket({
  roomId,
  token,
  onGiftAnimation,
  onSparkStormEvent,
  baseUrl = DEFAULT_BASE,
} = {}) {
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const onGiftRef = useRef(onGiftAnimation);
  const onStormRef = useRef(onSparkStormEvent);

  // Keep refs current so the ws.onmessage closure never goes stale.
  useEffect(() => { onGiftRef.current = onGiftAnimation; }, [onGiftAnimation]);
  useEffect(() => { onStormRef.current = onSparkStormEvent; }, [onSparkStormEvent]);

  const connect = useCallback(() => {
    if (!roomId) return;

    const wsBase = httpToWs(baseUrl);
    const query = token ? "?token=" + encodeURIComponent(token) : "";
    const url = wsBase + "/room/" + roomId + query;

    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      // WebSocket unavailable (SSR, test env, network blocked) - no-op.
      return;
    }

    wsRef.current = ws;

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      const { type, payload } = msg || {};

      if (type === "gift_animation" || type === "platform_banner") {
        const catalogId = resolveGiftId(payload?.gift_type_id);
        if (GIFT_EFFECT_MAP[catalogId]) {
          onGiftRef.current && onGiftRef.current({
            id: payload?.id || String(Date.now()),
            giftId: catalogId,
            sender: payload?.sender_name || "Someone",
            recipient: payload?.recipient_name || "the room",
            timestamp: Date.now(),
          });
        }
      }

      if (
        type === "spark_storm_start" ||
        type === "spark_storm_update" ||
        type === "spark_storm_complete"
      ) {
        onStormRef.current && onStormRef.current({ type, payload });
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      // Back off 5s then retry - backend may be restarting.
      retryRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      // onerror is always followed by onclose; let onclose handle reconnect.
      ws.close();
    };
  }, [roomId, token, baseUrl]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on deliberate unmount
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // sendGift: calls POST /api/gifts/send and returns parsed response or null.
  const sendGift = useCallback(
    async ({ performerId, giftTypeId, roomId: overrideRoomId, token: overrideToken } = {}) => {
      const effectiveToken = overrideToken || token;
      const effectiveRoomId = overrideRoomId || roomId;
      try {
        const res = await fetch(baseUrl + "/api/gifts/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(effectiveToken ? { Authorization: "Bearer " + effectiveToken } : {}),
          },
          body: JSON.stringify({
            performer_id: performerId,
            gift_type_id: giftTypeId,
            room_id: effectiveRoomId,
          }),
        });
        return res.ok ? res.json() : null;
      } catch {
        return null;
      }
    },
    [roomId, token, baseUrl]
  );

  return { sendGift };
}
