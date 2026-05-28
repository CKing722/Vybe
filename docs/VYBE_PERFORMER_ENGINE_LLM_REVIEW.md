# VYBE Performer Engine LLM Review Notes

## Current Implementation State

- The website no longer attempts to animate a 2D performer image in the live room.
- `VybePerformerStream` is now the room background contract: UE5 Pixel Streaming video in, existing chat/gifts/games/requests overlaid on top.
- Viewer chat, gifts, game selections, requests, enter, and leave events are forwarded as `viewer.event` messages to MUSE.
- The Python Performer Runtime loads a performer JSON profile, gates commands by permission/profile/prop approval, and can run in `--dry-run` mode without Unreal.
- A UE5 project scaffold, Remote Control contract, mock Unreal WebSocket server, and MUSE smoke client now exist under `performer-engine/`.
- The local harness has been tested through real WebSockets: MUSE smoke client -> Performer Runtime -> mock Unreal Remote Control server.
- Phase 7 now has a motion-library manifest and realism acceptance checklist, but real UE5 animation assets are still required.
- The Unreal/MetaHuman project remains the real visual execution layer and must be built in UE5 by a human/technical artist.

## Main Concerns To Review

1. The runtime can validate commands, but it cannot prove motion realism until a real MetaHuman/GLB-quality asset, rig, animation blueprint, and motion library exist.
2. The frontend can prove overlay architecture locally, but the true WebRTC handshake still needs validation against the exact UE5 Pixel Streaming signaling server version used in production.
3. The performer profile is the compliance and consent source of truth. LLMs should review whether every private-tier action, prop, wardrobe state, and camera move has a clear permission key and denial path.
4. The MUSE orchestrator still needs a strict command planner so it only emits known protocol messages and handles `performer.permission_denied` without retry loops.
5. The frontend supports an optional placeholder video source for local overlay work, but no fake performer asset should be treated as a realism milestone. It must be replaced by UE5 Pixel Streaming before any visual realism review.
6. The motion library is the biggest quality blocker: every pose transition, facial expression, prop interaction, voice viseme, gaze target, and camera move needs authored clips or Control Rig logic.
7. The UE5 Remote Control object paths in `performer_runtime.py` must match the final Blueprint asset paths exactly.
8. Voice sync still requires a tested viseme pipeline from TTS output into `ProcessVisemes` on the UE5 face rig.
9. The local machine does not have UE5 installed, so editor-level validation, MetaHuman import, Blueprint exposure, Pixel Streaming launch, and animation QA are not complete.
10. Backend MUSE-to-runtime command translation exists as a standalone client service; reviewers should decide where to invoke it in the live MUSE event/tick path once deployment topology is confirmed.

## What Not To Regress

- Do not return to CSS/photo animation, sliced body layers, canvas character hacks, or Three.js performer rendering.
- Do not let viewer events directly execute actions. They should inform MUSE, and MUSE should emit permission-gated performer commands.
- Do not ship without standalone runtime tests, frontend build validation, WebRTC smoke tests, and Unreal-side Blueprint path validation.
