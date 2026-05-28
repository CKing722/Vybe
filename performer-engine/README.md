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
3. Review `protocols/muse-performer-protocol.json` for the MUSE message format
4. Review `contracts/unreal-remote-control-contract.json` for the UE5 function contract

## Directory Layout

```
CODEX_BUILD_INSTRUCTIONS.md    Step-by-step for Codex to follow
docs/
  ARCHITECTURE.md              System overview and data flow
protocols/
  muse-performer-protocol.json WebSocket message schemas
contracts/
  unreal-remote-control-contract.json UE5 objectPath/function contract
muse-bridge/
  performer_runtime.py         Python bridge (MUSE <-> Unreal)
  requirements.txt             Python dependencies
performers/
  luna.json                    Performer permission/profile config
tests/
  test_*.py                    Runtime and contract tests
unreal-specs/
  PROJECT_SETUP.md             UE5 project structure and config
tools/
  mock_unreal_remote.py        Validates runtime -> UE command envelopes
  muse_smoke_client.py         Sends smoke commands into the runtime
unreal-project/
  VybePerformer.uproject       UE5 project scaffold and C++ function signatures
qa/
  PHASE_VALIDATION_MATRIX.md   Current phase status and blockers
```

## Build Order

1. Website integration (React component + placeholder video)
2. Performer Runtime (Python WebSocket bridge)
3. Unreal Engine 5 project (MetaHuman + Pixel Streaming)
4. Browser to UE5 Pixel Streaming validation
5. Runtime to UE5 Remote Control validation
6. MUSE to Runtime validation
7. Build motion library
8. Iterate on realism, latency, and expression quality
