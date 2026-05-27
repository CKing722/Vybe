import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_SIGNALING_URL = "ws://localhost:8888";
const DEFAULT_MUSE_URL = "ws://localhost:9000";
const DEFAULT_PLACEHOLDER_SRC = "";
const RECONNECT_INTERVAL_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

function normalizeIceCandidate(candidate) {
  if (!candidate) return null;
  if (typeof candidate === "string") return { candidate };
  return candidate;
}

async function connectPixelStream({ signalingUrl, videoEl, onStatus }) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });
  const ws = new WebSocket(signalingUrl);
  let closed = false;

  const safeSend = (payload) => {
    if (closed || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  };

  pc.ontrack = (event) => {
    const [stream] = event.streams || [];
    if (!stream) return;
    videoEl.srcObject = stream;
    onStatus("streaming");
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      safeSend({ type: "iceCandidate", candidate: event.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
      onStatus(pc.connectionState === "failed" ? "error" : "disconnected");
    }
  };

  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });

  ws.onopen = async () => {
    onStatus("signaling");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    safeSend({ type: "offer", sdp: offer.sdp });
  };

  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp }));
      return;
    }

    if (msg.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: msg.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      safeSend({ type: "answer", sdp: answer.sdp });
      return;
    }

    if (msg.type === "iceCandidate") {
      const candidate = normalizeIceCandidate(msg.candidate);
      if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  ws.onerror = () => onStatus("error");
  ws.onclose = () => {
    if (!closed) onStatus("disconnected");
  };

  return {
    close() {
      closed = true;
      ws.close();
      pc.close();
    },
  };
}

function createEventEmitter(museUrl) {
  let ws = null;
  let reconnectTimer = null;
  let stopped = false;
  const queue = [];

  const connect = () => {
    if (stopped || !museUrl || typeof WebSocket === "undefined") return;
    ws = new WebSocket(museUrl);

    ws.onopen = () => {
      while (queue.length && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(queue.shift()));
      }
    };

    ws.onclose = () => {
      if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_INTERVAL_MS);
    };
  };

  connect();

  return {
    send(event) {
      if (!event) return false;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
        return true;
      }
      queue.push(event);
      if (queue.length > 100) queue.shift();
      return false;
    },
    close() {
      stopped = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}

export default function VybePerformerStream({
  signalingUrl = DEFAULT_SIGNALING_URL,
  museUrl = DEFAULT_MUSE_URL,
  performerId = "luna_001",
  roomId = "room_default",
  viewerId = "current_viewer",
  viewerName = "Viewer",
  placeholderSrc = DEFAULT_PLACEHOLDER_SRC,
  muted = false,
  className,
  style,
  onStreamReady,
  onStatusChange,
  onEventSenderReady,
  children,
}) {
  const videoRef = useRef(null);
  const connectionRef = useRef(null);
  const emitterRef = useRef(null);
  const streamReadyRef = useRef(false);
  const [status, setStatus] = useState("connecting");
  const [attempt, setAttempt] = useState(0);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);

  const updateStatus = useCallback(
    (nextStatus) => {
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
      if (nextStatus === "streaming" && !streamReadyRef.current) {
        streamReadyRef.current = true;
        onStreamReady?.();
      }
    },
    [onStatusChange, onStreamReady],
  );

  useEffect(() => {
    streamReadyRef.current = false;
    setPlaceholderFailed(false);
  }, [signalingUrl, placeholderSrc]);

  useEffect(() => {
    if (!videoRef.current || typeof WebSocket === "undefined" || typeof RTCPeerConnection === "undefined") {
      updateStatus("placeholder");
      return undefined;
    }

    let cancelled = false;
    updateStatus(attempt > 0 ? "reconnecting" : "connecting");

    connectPixelStream({ signalingUrl, videoEl: videoRef.current, onStatus: updateStatus })
      .then((connection) => {
        if (cancelled) {
          connection.close();
          return;
        }
        connectionRef.current = connection;
      })
      .catch(() => {
        updateStatus("error");
        if (attempt < MAX_RECONNECT_ATTEMPTS) {
          window.setTimeout(() => setAttempt((value) => value + 1), RECONNECT_INTERVAL_MS);
        }
      });

    return () => {
      cancelled = true;
      connectionRef.current?.close();
      connectionRef.current = null;
    };
  }, [attempt, signalingUrl, updateStatus]);

  useEffect(() => {
    emitterRef.current?.close();
    emitterRef.current = createEventEmitter(museUrl);
    return () => {
      emitterRef.current?.close();
      emitterRef.current = null;
    };
  }, [museUrl]);

  const sendViewerEvent = useCallback(
    (eventType, data = {}) => {
      const payload = {
        type: "viewer.event",
        event: eventType,
        viewer_id: String(viewerId || "current_viewer"),
        viewer_name: String(viewerName || "Viewer"),
        data: {
          ...data,
          room_id: roomId,
          performer_id: performerId,
        },
        sent_at: new Date().toISOString(),
      };
      emitterRef.current?.send(payload);
      return payload;
    },
    [performerId, roomId, viewerId, viewerName],
  );

  useEffect(() => {
    onEventSenderReady?.(sendViewerEvent);
    sendViewerEvent("enter", { source: "vybe_performer_stream" });
    return () => {
      sendViewerEvent("leave", { source: "vybe_performer_stream" });
      onEventSenderReady?.(null);
    };
  }, [onEventSenderReady, sendViewerEvent]);

  const childContext = useMemo(() => ({ sendViewerEvent, status }), [sendViewerEvent, status]);
  const showingPlaceholder = status !== "streaming";

  return (
    <div
      className={className}
      data-vybe-performer-stream="true"
      data-renderer-contract="ue5-pixel-streaming"
      data-no-2d-character-animation="true"
      data-stream-status={status}
      style={{ ...styles.container, ...style }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{ ...styles.video, opacity: status === "streaming" ? 1 : 0 }}
      />

      {showingPlaceholder && (
        <div data-vybe-performer-placeholder="true" style={styles.placeholder}>
          {placeholderSrc && !placeholderFailed && (
            <video
              data-vybe-placeholder-video="true"
              src={placeholderSrc}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setPlaceholderFailed(true)}
              style={styles.placeholderVideo}
            />
          )}
          <div style={styles.signalGrid} />
          <div style={styles.statusPanel}>
            <div style={styles.kicker}>UE5 Pixel Streaming</div>
            <div style={styles.statusText}>
              {status === "connecting" && "Connecting to performer renderer"}
              {status === "signaling" && "Establishing WebRTC stream"}
              {status === "reconnecting" && "Reconnecting to renderer"}
              {status === "disconnected" && "Renderer disconnected"}
              {status === "error" && "Renderer unavailable, using placeholder"}
              {status === "placeholder" && "Renderer APIs unavailable"}
            </div>
            <div style={styles.contractText}>No 2D image slicing. No photo animation. Real motion comes from Unreal.</div>
          </div>
        </div>
      )}

      {children && (
        <div style={styles.uiOverlay}>{typeof children === "function" ? children(childContext) : children}</div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#050810",
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "opacity .28s ease",
  },
  placeholder: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background:
      "radial-gradient(ellipse at 45% 62%, rgba(255,45,120,.18), transparent 46%), radial-gradient(ellipse at 58% 34%, rgba(0,212,255,.13), transparent 44%), linear-gradient(180deg,#080e1c,#0a0814 52%,#0d061a)",
  },
  placeholderVideo: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.58,
    filter: "saturate(1.1) contrast(1.08)",
  },
  signalGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
    maskImage: "radial-gradient(circle at center, black, transparent 72%)",
    opacity: 0.28,
  },
  statusPanel: {
    position: "absolute",
    left: "50%",
    bottom: "14%",
    transform: "translateX(-50%)",
    width: "min(520px, calc(100% - 40px))",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.12)",
    background: "linear-gradient(135deg, rgba(10,14,24,.78), rgba(7,9,16,.92))",
    boxShadow: "0 24px 90px rgba(0,0,0,.38)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    textAlign: "center",
  },
  kicker: {
    color: "#ffab00",
    fontSize: ".62rem",
    fontWeight: 1000,
    letterSpacing: ".16em",
    textTransform: "uppercase",
  },
  statusText: {
    marginTop: 5,
    color: "#fff",
    fontSize: ".94rem",
    fontWeight: 1000,
  },
  contractText: {
    marginTop: 6,
    color: "rgba(255,255,255,.62)",
    fontSize: ".68rem",
    fontWeight: 800,
    lineHeight: 1.35,
  },
  uiOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 10,
    pointerEvents: "auto",
  },
};
