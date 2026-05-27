# VYBE Performer Engine

Proprietary real-time AI performer rendering system for the VYBE platform.

## What This Is

A complete architecture for rendering AI-controlled photorealistic
performers in real time, streamed to viewers via WebRTC. The AI brain
(MUSE) controls a 3D character rendered in Unreal Engine 5 through a
permission-gated command protocol.

## Quick Start

1. Read `CODEX_BUILD_INSTRUCTIONS.md` for the full build sequence
2. Read `docs/ARCHITECTURE.md` for the system overview
3. Review `protocols/muse-performer-protocol.json` for the message format

## Directory Layout

```
CODEX_BUILD_INSTRUCTIONS.md    Step-by-step for Codex to follow
docs/
  ARCHITECTURE.md              System overview and data flow
protocols/
  muse-performer-protocol.json WebSocket message schemas
src/
  muse-bridge/
    performer_runtime.py       Python bridge (MUSE <-> Unreal)
    requirements.txt           Python dependencies
  react-integration/
    VybePerformerStream.jsx    React component for vybe-live
  unreal-specs/
    PROJECT_SETUP.md           UE5 project structure and config
```

## Build Order

1. Website integration (React component + placeholder video)
2. Performer Runtime (Python WebSocket bridge)
3. Unreal Engine 5 project (MetaHuman + Pixel Streaming)
4. Connect all three layers
5. Build motion library and iterate on realism
