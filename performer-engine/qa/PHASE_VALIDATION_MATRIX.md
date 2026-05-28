# VYBE Performer Engine Phase Validation Matrix

## Phase 1: Website Stream Integration

Status: code complete, locally validated.

- Live room uses `<VybePerformerStream />` as the background layer.
- UI overlays remain outside the renderer and stay interactive.
- Viewer chat, gifts, games, requests, enter, and leave events forward to MUSE over WebSocket.
- Browser DOM check confirms `data-renderer-contract="ue5-pixel-streaming"` and no old fake body stage.

## Phase 2: Performer Runtime

Status: code complete, locally validated.

- Runtime loads performer permissions from JSON.
- Runtime gates commands by permission, blocked action, approved prop, and intensity cap.
- Runtime can run with `--dry-run` before Unreal exists.
- Unit tests cover state updates, denials, prop approval, camera, wardrobe, idle, voice sync, and WebSocket command cycles.

## Phase 3: Unreal Engine 5 Project

Status: scaffolded, blocked on UE5 editor and human technical art work.

- `.uproject`, config, module skeleton, and C++ Blueprint function signatures are present under `performer-engine/unreal-project`.
- Remote Control function contract is present under `performer-engine/contracts`.
- Still required in UE5: MetaHuman/imported performer asset, skeletal mesh, groom, cloth, Control Rig, Animation Blueprint, level, cameras, props, and exposed Remote Control objects.

## Phase 4: Browser To UE5 Pixel Streaming

Status: website side complete; real stream blocked on UE5/Pixel Streaming server.

- Frontend retries Pixel Streaming signaling URL and falls back to a non-character placeholder layer while the renderer is unavailable.
- Real validation requires UE5 running with Pixel Streaming at the configured `signalingUrl`.

## Phase 5: Runtime To UE5 Remote Control

Status: mock-validated; real validation blocked on UE5.

- `tools/mock_unreal_remote.py` validates outgoing runtime commands against `contracts/unreal-remote-control-contract.json`.
- Contract tests prove runtime command envelopes match expected UE5 object paths and functions.
- Local harness run proved `muse_smoke_client.py -> performer_runtime.py -> mock_unreal_remote.py` over real WebSockets.

## Phase 6: MUSE To Runtime

Status: smoke-client validated locally against the runtime.

- `tools/muse_smoke_client.py` sends representative MUSE performer commands to the runtime.
- Runtime returns state reports and permission denials for commands the performer profile does not permit.

## Phase 7: Motion Library

Status: specification only; blocked on animation assets.

- Required: authored or captured animations for idle, talk, reactions, transitions, action clips, facial expressions, and camera-safe prop interactions.
- Every clip must be mapped to a permission key before MUSE can request it.

## Phase 8: Realism Iteration

Status: blocked on Phase 3 and Phase 7 assets.

- Required: visual QA inside UE5, Pixel Streaming latency tests, facial viseme tuning, gaze/eyebrow tests, cloth/hair stability, camera framing, and long-session stress testing.
