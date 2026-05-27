# VYBE AI Avatar Rendering Pivot And LLM Review Packet

Date: 2026-05-27

## Executive Decision

The current 2D image-slicing prototype is rejected as a final or near-final performer approach.

It can be kept only as a visual reference and renderer-failure test. It must not be represented as a real AI performer, real 3D rig, or acceptable animation backend. A flat PNG split into head, torso, arm, hip, leg, and shoe layers is a paper-doll technique. It cannot produce believable human pose change, hand contact, mouth/eye/eyebrow performance, hair dynamics, cloth motion, anatomical deformation, camera-safe occlusion, or prop interaction.

The Forge UI is still useful as a control surface. The backend underneath it must change.

## Non-Negotiable Product Requirement

VYBE needs a real performer-rendering backend that can receive structured intent from MUSE and produce a believable, controllable, real-time avatar performance.

An acceptable renderer must support:

- Consented performer identity, likeness, and voice rights.
- A real deformation system: Live2D mesh deformation, GLB/VRM skeleton, MetaHuman rig, Unreal control rig, or neural avatar stream.
- Body pose families: standing, seated, reclined, kneeling, floor, close-up, transition, prop interaction, and camera-specific variants.
- Face controls: eye aim, blink, brow, mouth shapes, visemes, emotional blendshapes, head motion, and expression timing.
- Hair, cloth, jewelry, and accessory behavior, either simulated or prebaked.
- Hand/finger controls, object sockets, contact targets, occlusion rules, and collision checks.
- A QA gate that blocks any action when the required rig, clip, contact state, or compliance approval is missing.

This document stays non-explicit. Adult private-session action libraries must be handled as performer-approved, legally reviewed, gated motion assets; they should not be improvised from a flat image or unconstrained prompt.

## Recommended Renderer Strategy

### Path A: Fast MVP - Commissioned Live2D Performer

Use Live2D as the fastest route to something that actually feels alive in a browser.

Why:

- It supports authored deformation, expressions, eye motion, mouth motion, body sway, and gesture clips.
- It can integrate with Open-LLM-VTuber-style WebSocket control.
- It is not photoreal 3D, but it is far more honest and convincing than slicing one photo.

Use it for:

- Public-room AI host MVP.
- MUSE voice, chat, emotion, and game-event integration.
- Testing viewer memory, timing, economic orchestration, and avatar control messages.

Do not use it for:

- Claiming performer-identical photorealism.
- Complex physical adult private-session action realism.

Official references:

- Live2D Cubism SDK for Web: https://docs.live2d.com/en/cubism-sdk-manual/cubism-sdk-for-web/
- Live2D Cubism SDK overview: https://www.live2d.com/en/sdk/about/
- Open-LLM-VTuber docs: https://docs.llmvtuber.com/en/
- Open-LLM-VTuber GitHub: https://github.com/Open-LLM-VTuber/Open-LLM-VTuber

### Path B: Real Web 3D - GLB/VRM Runtime

Build VYBE Forge around real skinned models, not images.

Minimum runtime:

- Three.js/WebGL or WebGPU viewer.
- GLB/VRM loader.
- Humanoid skeleton inspection.
- Animation clip player.
- Blendshape/viseme player.
- IK target debug view.
- Pose and contact validation.
- QA panel for missing clips, broken joints, mesh clipping, and FPS.

Use it for:

- Local dev preview.
- Internal animation QA.
- Motion/prop/pose libraries.
- Browser-deployable lower-cost avatar tier.

Do not use it as the final premium tier unless the model, shader, hair, cloth, and capture quality are truly high end.

Official references:

- Ready Player Me 3D avatars are retrieved as GLB files and can include morph targets: https://docs.readyplayer.me/ready-player-me/api-reference/rest-api/avatars/get-3d-avatars
- MetaHuman custom animation concepts are useful even if final runtime is not Unreal: https://dev.epicgames.com/documentation/en-us/metahuman/play-a-custom-animation

### Path C: Premium Photoreal - MetaHuman / Unreal

Use MetaHuman/Unreal as the benchmark for the premium performer-identical future.

Why:

- MetaHuman is a full framework for fully rigged photoreal digital humans in Unreal Engine.
- It supports real-time animation from webcam, mobile capture, and audio through Live Link workflows.
- It exposes real rig concepts: body skeletal mesh, face/body control rigs, body correctives, rigid body simulation, hair grooms, retargeting, and animation assets.

Use it for:

- Performer-identical premium avatar tier.
- Studio-grade capture and rendering.
- High-fidelity face, mouth, brow, and body performance.
- Unreal-rendered stream into the VYBE room.

Critical implementation note:

The web app should probably receive a streamed render or a compressed avatar state, not try to run a full MetaHuman in-browser.

Official references:

- MetaHuman documentation: https://dev.epicgames.com/documentation/en-us/metahuman/metahuman-documentation
- MetaHuman real-time animation: https://dev.epicgames.com/documentation/metahuman/realtime-animation
- MetaHuman body conform controls and rigged topology: https://dev.epicgames.com/documentation/en-us/metahuman/body-conform-controls
- MetaHuman component with body correctives/facial animation/simulation controls: https://dev.epicgames.com/documentation/metahuman/the-metahuman-component-for-unreal-engine

### Path D: Neural LiveAvatar Provider

Use a neural avatar provider only after legal, adult-content policy, performer consent, and cost checks.

Why:

- This can shortcut custom rigging when the provider can drive a realistic avatar from audio/video.
- WebRTC avatar streams can be easier to drop into the VYBE room than building a full render farm on day one.

Concerns:

- Adult-content permissibility may vary by provider terms.
- Fine-grained body/hand/prop control may be limited.
- Latency, cost, and moderation policy can become product blockers.
- It may not support arbitrary pose/action families with the precision VYBE needs.

Official references:

- HeyGen Audio-to-Video WebSocket API notes that Interactive Avatar is being upgraded to LiveAvatar and recommends integrating with LiveAvatar: https://docs.heygen.com/reference/heygen-interactive-avatar-realtime-api
- HeyGen avatar video API overview: https://docs.heygen.com/docs/create-videos-with-avatars

### Path E: VYBE Proprietary Performer Suite

This is the actual long-term product: VYBE Forge as an orchestration and QA layer over scans, rigs, motion, simulation, renderers, and MUSE intelligence.

It should not try to replace Blender, Unreal, Maya, MetaHuman, Live2D, mocap, and neural avatars immediately. It should wrap the right pieces into a vertical workflow:

`Prompt -> IntentSpec -> Performer Identity -> Mesh/Model -> Rig -> Motion Plan -> Simulation -> Renderer -> QA Gate -> Live Runtime`

Core modules:

- Performer Identity Engine: consent, likeness, body profile, voice profile, revocation and audit trail.
- Rig Builder: skeleton, IK, blendshapes, visemes, pose constraints, contact anchors.
- Motion Engine: clip retrieval, mocap retargeting, text-to-motion planning, smoothing, foot/contact locks.
- Simulation: hair, cloth, accessories, soft-body approximations, collision, occlusion.
- Renderer Adapter: Live2D, Three.js GLB/VRM, Unreal/MetaHuman stream, neural LiveAvatar stream.
- QA Evaluator: blocks impossible or unapproved action requests.

NVIDIA ACE is a useful architecture reference for modular digital human services: speech, LLM, animation graph, Audio2Face-2D/3D, and renderers.

Official references:

- NVIDIA ACE overview: https://docs.nvidia.com/ace/overview/latest/
- NVIDIA Audio2Face-3D converts speech into ARKit blendshapes and emotional facial animation for 3D avatars: https://docs.nvidia.com/ace/audio2face-3d-microservice/1.0/text/getting-started/overview.html
- NVIDIA Audio2Face-3D NIM: https://docs.nvidia.com/nim/digital-human/a2f-3d/latest/index.html

## Voice And Facial Performance Direction

The voice layer must be coupled to face animation. Audio should not merely play while the mouth opens randomly.

Required pipeline:

1. MUSE generates transcript, intent, emotional state, and timing.
2. TTS generates streaming audio.
3. Audio analysis or TTS marks generate phoneme/viseme timing.
4. Face renderer receives visemes, jaw, lip, brow, blink, gaze, head motion, and emotion.
5. QA checks that the mouth/eye/brow behavior matches the spoken performance.

ElevenLabs is a strong voice candidate, but model choice matters:

- Flash models are better for low-latency interactive use.
- Eleven v3 is more expressive, but official docs warn it is not suitable for real-time/conversational use when consistency and latency matter.

Official references:

- ElevenLabs text-to-speech overview: https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- ElevenLabs streaming endpoint: https://elevenlabs.io/docs/api-reference/text-to-speech/stream
- ElevenLabs WebSocket TTS help: https://help.elevenlabs.io/hc/en-us/articles/28084327728529-What-is-the-Text-to-Speech-WebSockets-API
- Eleven v3 limitation note: https://help.elevenlabs.io/hc/en-us/articles/35869054119057-What-is-Eleven-v3

## Pose And Action Test Matrix

This is the minimum QA taxonomy. Each item needs motion clips, rig support, contact data, camera data, and pass/fail checks.

| Category | Required Checks |
|---|---|
| Idle standing | Breath, gaze, posture, weight transfer, hair, cloth, no foot sliding |
| Talk | Visemes, jaw, lips, brow, eye aim, head motion, expression timing |
| Lean-in | Spine IK, balance, camera crop, hair/cloth response |
| Celebration | Arms, hands, torso, face, hair, cloth, timing against gift/game event |
| Walk/runway | Foot locks, hip motion, knee/ankle arcs, heel contact, no skating |
| Seated | Pelvis contact, spine compression, leg placement, camera framing |
| Reclined | Back/hip support, hair contact, limb occlusion, camera framing |
| Kneeling/floor | Knee/foot contact, center of mass, joint limits, surface contact |
| Close-up | Face, eyes, hands, object visibility, focus, crop safety |
| Prop/object interaction | Hand sockets, grip, occlusion, collision, contact target, state sync |
| Transition | No popping, no teleporting limbs, no mesh clipping, no camera break |
| Voice-emotion sync | Mouth, eyes, brows, head, breath, and body micro-motion match audio |

Each private-session action family must have:

- Performer-approved motion source.
- Legal/compliance approval.
- Consent metadata.
- Compatible model/rig.
- Contact and occlusion map.
- QA clips across camera angles.
- A hard fallback when any dependency is missing.

## Current Concerns And Issues For LLM Review

1. The existing Forge preview was built as a 2D sliced-image prototype. That approach is fundamentally wrong for the product target.
2. The UI labels imply real rigging concepts, but a real renderer backend is not yet connected.
3. There is no production-ready performer model in the repo: no Live2D model, no GLB/VRM, no MetaHuman, no neural avatar session.
4. There is no verified pose library for seated, reclined, kneeling, floor, close-up, transition, or private-session action families.
5. There are no real hand/finger controls, object sockets, collision meshes, or contact targets yet.
6. There is no hair/cloth/accessory simulation in the local preview.
7. There is no true mouth/eye/brow/viseme synchronization with voice yet.
8. There is no voice provider adapter connected yet; MUSE currently uses a provider-safe local voice contract.
9. Neural avatar providers may block adult content by policy; this must be verified before relying on them.
10. MetaHuman/Unreal may be the most realistic route, but it likely requires GPU rendering and streaming rather than in-browser rendering.
11. Live2D is the fastest believable MVP, but it is not photoreal 3D and should not be sold as performer-identical.
12. Adult performer likeness and voice require explicit consent, release tracking, revocation handling, and audit logs.
13. The product must avoid prompt-only physical actions. It needs approved motion clips or captured performances.
14. The QA system must block unsupported action requests instead of faking them.
15. The cost model for GPU rendering, neural avatar streaming, TTS, and LLM orchestration is still unknown.

## Questions To Give Other LLM Reviewers

1. Which renderer path should VYBE pursue first: Live2D MVP, GLB/VRM runtime, MetaHuman/Unreal stream, or neural LiveAvatar provider?
2. What is the fastest path to a convincing browser demo that is not a paper doll?
3. What exact model format and runtime should VYBE standardize on for its proprietary avatar pipeline?
4. How should VYBE encode pose/action requirements so unsupported requests are blocked automatically?
5. What providers are compatible with adult-content use cases under their current terms?
6. What is the minimum data capture package required from a consenting performer to build a high-quality avatar?
7. What should the first QA harness test: motion smoothness, contact/collision, visemes, latency, or identity consistency?
8. Should the premium photoreal tier be built in Unreal first and streamed to web, or should VYBE attempt a pure web runtime?
9. How should voice emotion, visemes, eye movement, eyebrows, and body micro-motion be synchronized?
10. What parts should VYBE build proprietary versus integrate from existing vendors?

## Immediate Next Build Direction

Stop spending time on 2D photo slicing.

Next local milestones:

1. Add a renderer adapter contract:
   - `live2d`
   - `web3d_glb_vrm`
   - `metahuman_unreal_stream`
   - `neural_liveavatar_stream`
2. Add a real renderer readiness schema and QA gate.
3. Add a sample real GLB/VRM or commissioned Live2D placeholder only if it has actual rig controls.
4. Wire MUSE avatar events to the renderer adapter.
5. Build a pose/action clip inventory and test harness.
6. Keep Forge hidden from the production website until the renderer gate passes.
