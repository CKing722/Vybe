# VYBE-GHO-007 - No-cost 3D Gift Spectacle Pipeline

Date: 2026-05-24
Owner: Hermes research support
Scope: open-source/no-cost, 2026-ready browser 3D pipeline for VYBE gift spectacle effects. No paid assets, paid APIs, or proprietary runtime dependency required.

## Executive recommendation

Use a glTF/GLB-first asset pipeline with Three.js as the default runtime renderer, Babylon.js as the advanced-scene/authoring alternative, and PixiJS as the 2D/particles/UI overlay engine when a full 3D scene graph is unnecessary.

Recommended default stack:

1. Author assets in Blender LTS, export GLB/glTF 2.0.
2. Optimize with Khronos/glTF ecosystem tooling: mesh compression, texture compression, image resizing, material cleanup, and scene validation.
3. Render in browser with Three.js using WebGL as the production baseline and WebGPU as a progressive enhancement where available.
4. Use a small JSON effect DSL validated by JSON Schema to drive gifts, timelines, shader parameters, particles, camera choreography, LOD, and capability fallback.
5. Keep mobile GPU budgets strict: small GLB payloads, compressed textures, capped draw calls, particle pooling, reduced back-buffer resolution under thermal load, and fallback tiers.
6. Preserve AR/spatial readiness by keeping assets physically scaled, PBR-compatible, glTF-valid, and convertible to WebXR/model-viewer/USDZ workflows later.

Rationale:

- WebGPU is the forward path but is still marked by MDN as limited availability/not Baseline and secure-context only; production must keep WebGL fallback.
- glTF 2.0 is the safest asset interchange target for runtime 3D delivery and browser engines.
- Blender 4.5 LTS is maintained until July 2027, giving a no-cost authoring baseline through the 2026 planning window.
- Three.js has the largest web-3D adoption surface and current npm release 0.184.0; Babylon.js current npm release is 9.9.1 and has first-class WebGPU/Node Material support; PixiJS current npm release is 8.18.1 and explicitly supports WebGL and WebGPU renderers for high-performance 2D/scene effects.

## Source baseline

| Area | Current source | Key point used |
|---|---|---|
| WebGPU standard | W3C WebGPU Candidate Recommendation Draft, 2026-05-21 | WebGPU is the emerging browser GPU API for rendering and compute. |
| WGSL shaders | W3C WGSL Candidate Recommendation Draft, 2026-05-19 | WGSL is the shader language for WebGPU. |
| WebGPU availability | MDN WebGPU API | MDN marks WebGPU limited availability/not Baseline and secure-context only. |
| WebGL production fallback | MDN WebGL best practices | Official guidance covers system limits, per-pixel VRAM budgets, smaller back buffers, batching, mipmaps, shader compile/link discipline, and avoiding blocking calls. |
| Asset format | Khronos glTF and glTF 2.0 specification | glTF is runtime 3D asset delivery; GLB is the binary packaging form. |
| Authoring | Blender LTS and Blender glTF 2.0 manual | Blender 4.5 LTS is supported until July 2027; Blender manual documents glTF 2.0 import/export. |
| Three.js | three npm package and official docs | Current npm release observed: 0.184.0; strong default for web 3D and WebGPU experimentation. |
| Babylon.js | @babylonjs/core npm package and Babylon WebGPU support docs | Current npm release observed: 9.9.1; WebGPU available since Babylon.js 5.0 and backward-compatible with WebGL engine path; Node Material supports WebGL/WebGPU. |
| PixiJS | pixi.js npm package and PixiJS official docs | Current npm release observed: 8.18.1; PixiJS v8 docs advertise WebGL and WebGPU renderers. |
| Effect DSL | JSON Schema | JSON Schema gives a no-cost validation vocabulary for portable JSON effect definitions. |
| AR/spatial | MDN WebXR Device API, Immersive Web, model-viewer | WebXR is still limited/experimental on MDN; assets should be prepared for future AR, not hard-dependent on AR in launch path. |

## Target architecture

```text
Gift event
  -> gift_id + sender + value + theme + locale + device capability
  -> JSON effect DSL document
  -> capability resolver
       Tier 0: CSS/Lottie/static fallback
       Tier 1: PixiJS/WebGL 2D particles overlay
       Tier 2: Three.js/Babylon WebGL GLB scene
       Tier 3: Three.js/Babylon WebGPU enhanced scene/compute particles
       Future: WebXR/model-viewer/AR placement
  -> asset manifest
       GLB models, compressed textures, shaders, audio cues, icon sprites
  -> runtime renderer
       deterministic timeline, pooled particles, telemetry, thermal downgrade
```

Hard launch rule: no gift effect may require WebGPU, WebXR, paid APIs, paid models, or paid asset marketplaces. Those are optional enhancement layers only.

## Runtime engine choice

### Three.js - recommended default

Use for:

- High-visual-impact 3D gift scenes: characters, props, camera moves, reflective/PBR materials, post-processing, instanced particles.
- Small team velocity and broad community examples.
- glTF/GLB loading as the primary asset path.
- WebGPU experimentation while retaining WebGLRenderer fallback.

Strengths:

- Broadest common denominator for browser 3D.
- Strong ecosystem for glTF loading, Draco/Meshopt/KTX2 texture workflows, post-processing, shaders, and examples.
- Easier to keep a lean custom runtime than Babylon when the app needs spectacle snippets rather than full game-world systems.

Risks:

- WebGPU renderer remains an enhancement path, not the only launch renderer.
- Shader portability requires discipline: write GLSL/WebGL materials first unless a gift explicitly targets WebGPU enhancement.

Decision: default for VYBE launch effects.

### Babylon.js - recommended advanced alternative

Use for:

- More complex scene tooling, inspector-heavy debugging, Node Material authoring, physics-like interactions, or richer scene lifecycle controls.
- Effects where WebGPU/WebGL compatibility inside one engine abstraction is more valuable than a smaller runtime.

Official Babylon WebGPU support docs state WebGPU support has been available since Babylon.js 5.0 and is backward-compatible with the WebGL implementation; docs also call out Node Material support for WebGL and WebGPU.

Strengths:

- Strong engine abstraction, material editor, inspector, scene management.
- Good candidate for internal effect prototyping and higher-end "spectacle" tiers.

Risks:

- Heavier mental/runtime footprint if VYBE only needs short-lived gift animations.

Decision: maintain as second supported engine for complex or tooling-heavy effects, not default for every gift.

### PixiJS - recommended 2D/overlay engine

Use for:

- High-volume coins, hearts, confetti, stickers, badges, sprite trails, text, masks, simple filters, and UI overlays.
- Lower-end devices where 3D GLB scenes would waste GPU budget.
- Hybrid scene: Pixi overlay on top of Three/Babylon canvas for 2D reaction effects.

PixiJS v8 official docs/API advertise WebGL and WebGPU renderers, fast HTML5 rendering, asset loader, multitouch support, masks, filters, blend modes, and dynamic textures.

Strengths:

- Excellent for many gift categories that are visually rich but not truly 3D.
- Easier draw-call and texture-atlas control.

Risks:

- Not a full 3D asset pipeline. Do not force GLB-based gifts through Pixi.

Decision: use as Tier 1 and overlay layer, especially for mobile budget protection.

## Asset pipeline: Blender to glTF/GLB

Authoring baseline:

- Blender 4.5 LTS for production authoring during 2026; Blender site states 4.5 LTS is supported until July 2027.
- Export GLB for packaged runtime delivery; use .gltf only when pipeline needs loose JSON/bin/textures during debugging.
- Validate every exported asset against glTF 2.0 expectations before runtime ingest.

Blender authoring conventions:

- Unit scale: 1 Blender unit = 1 meter for AR/spatial readiness.
- Origin: gift effect root at world origin; forward/up conventions documented in asset README.
- Materials: prefer PBR Principled BSDF-compatible materials; avoid procedural-only materials that cannot export cleanly to glTF.
- Animation: use named clips with deterministic names such as `intro`, `loop`, `burst`, `outro`.
- Geometry: freeze transforms, remove hidden geometry, avoid non-manifold surprises, apply modifiers intentionally before export.
- Textures: power-of-two where mipmaps matter; compressed runtime derivatives generated after export.
- Licensing: only self-authored, CC0, permissive, or internally licensed assets. No paid marketplace dependency.

Optimization steps:

1. Export GLB from Blender.
2. Run glTF validation.
3. Run mesh simplification/quantization where acceptable.
4. Apply mesh compression where runtime support is confirmed.
5. Convert textures to GPU-friendly compressed variants where supported, with PNG/JPEG fallback if needed.
6. Generate LOD variants: high, medium, low, static/poster.
7. Emit asset manifest with byte sizes, texture dimensions, animation clips, material count, draw-call estimate, and feature flags.

Suggested no-cost tools:

- Blender built-in glTF 2.0 importer/exporter.
- Khronos glTF Validator.
- glTF-Transform CLI/library for inspect, optimize, prune, dedup, texture resizing, compression workflows.
- meshoptimizer/gltfpack for mesh optimization where acceptable.
- Basis Universal/KTX tooling for texture compression experiments.

## Shader and material authoring

Recommended launch policy:

- Default material path: glTF PBR materials exported from Blender.
- Custom WebGL path: engine material systems and GLSL snippets only when visual delta justifies complexity.
- WebGPU path: WGSL only for Tier 3 enhanced effects; never make WGSL the only implementation for launch.
- Babylon-specific path: Node Material when visual designers need node graph authoring that can target WebGL and WebGPU.

Shader/material rules:

- Keep all shader parameters externally controllable through the JSON DSL: colors, scalar intensities, texture URLs, time multipliers, blend modes, emission strength, particle count caps.
- Avoid per-gift bespoke shader code unless the effect is a flagship reusable template.
- Build a shared material library: hologram, glass, metallic foil, neon rim, magic smoke, confetti, starburst, soft glow.
- Precompile/warm high-traffic effects during idle time where engine allows.
- Use mipmaps for 3D-visible textures, consistent with MDN WebGL best practices.
- Prefer vertex-stage work and instancing for repeated geometry/particles where feasible.

## JSON effect DSL

Use JSON Schema to validate effect documents before deployment and at runtime ingest. The DSL should describe intent and parameters, not arbitrary executable code.

Minimal example:

```json
{
  "schemaVersion": "1.0.0",
  "effectId": "gift.phoenix.gold.v1",
  "engine": { "preferred": "three", "fallback": ["pixi", "css"] },
  "capabilities": {
    "minTier": 1,
    "webgpuEnhancement": true,
    "webxrReady": false
  },
  "assets": {
    "glb": "/assets/gifts/phoenix/phoenix.glb",
    "poster": "/assets/gifts/phoenix/poster.webp",
    "textures": ["/assets/gifts/phoenix/spark.ktx2"]
  },
  "timeline": [
    { "at": 0, "action": "load" },
    { "at": 80, "action": "playAnimation", "clip": "intro" },
    { "at": 500, "action": "emitParticles", "preset": "gold_sparks", "count": 160 },
    { "at": 2200, "action": "fadeOut", "duration": 400 }
  ],
  "params": {
    "primaryColor": "#FFD76A",
    "intensity": 0.85,
    "maxParticlesMobile": 96,
    "maxParticlesDesktop": 320
  },
  "budgets": {
    "maxDownloadKB": 900,
    "maxTexturePixels": 1048576,
    "maxDrawCalls": 40,
    "targetFrameMs": 16.7
  }
}
```

DSL governance:

- Validate with JSON Schema in CI and before publishing.
- Disallow arbitrary JavaScript in DSL.
- Version every schema and effect.
- Require declared budgets and fallbacks for each effect.
- Include a deterministic random seed option for replay/debugging.
- Include accessibility controls: reduced motion, muted audio, flash intensity limits.

## Mobile GPU budgets

Use budgets as acceptance gates, not suggestions. MDN WebGL best practices explicitly calls out system limits, per-pixel VRAM budget estimation, smaller back buffers, batching draw calls, eager deletion, mipmaps, and avoiding blocking API calls.

Initial conservative budgets for VYBE gift spectacle:

| Tier | Device target | Runtime | Download | Texture budget | Draw calls | Particles | Frame target |
|---|---|---|---:|---:|---:|---:|---:|
| 0 | Very low/end or reduced-motion | CSS/static/poster | <=150 KB | n/a | n/a | 0 | 60 FPS UI unaffected |
| 1 | Low mobile | Pixi/WebGL 2D | <=400 KB | <=1024^2 aggregate visible | <=20 | <=80 | <=16.7 ms |
| 2 | Mid mobile | Three/Babylon WebGL | <=900 KB | <=2048^2 aggregate visible | <=40 | <=160 | <=16.7 ms target, <=33 ms allowed burst |
| 3 | High mobile/desktop | WebGPU/WebGL enhanced | <=1800 KB | <=4096^2 aggregate visible | <=80 | <=500 | <=16.7 ms |

Runtime controls:

- Detect renderer capability at startup: WebGPU adapter/device, WebGL2, WebGL1, max texture size, compressed texture extensions, device memory hint if available, reduced-motion preference, battery/thermal signals where available.
- Use dynamic quality scaling: render scale 1.0 -> 0.75 -> 0.5; particle cap reduction; disable post-processing; switch to poster/2D fallback.
- Pool meshes, sprites, materials, buffers, and particles. Avoid gift-trigger allocation spikes.
- Keep maximum concurrent spectacle effects configurable. Queue or merge effects under load.
- Track frame time, dropped frames, context loss, GPU errors, asset load failure, and fallback path.

## WebGPU/WebGL fallback model

Policy:

- WebGL2 is the production 3D baseline.
- WebGL1 support is best-effort only if analytics show target users need it.
- WebGPU is progressive enhancement for high-end gifts, compute-like particles, and future shader work.
- Every WebGPU effect must have a WebGL or Pixi/CSS fallback.

Capability resolver pseudocode:

```ts
async function resolveGiftTier(effect, env) {
  if (env.reducedMotion) return "tier0";
  if (effect.requires3D && env.webgl2) {
    if (effect.webgpuEnhancement && env.webgpu && env.deviceClass === "high") return "tier3";
    return "tier2";
  }
  if (env.webgl1 || env.webgl2) return "tier1";
  return "tier0";
}
```

Security and reliability:

- Serve WebGPU/WebXR only over HTTPS secure contexts.
- Treat GPU context loss as normal; implement recovery/fallback.
- Never ingest untrusted remote glTF/texture/shader URLs directly from users.
- Sanitize and allowlist asset URLs from the signed manifest.
- Do not permit arbitrary shader text in user-generated gifts.

## Future AR/spatial readiness

Do now:

- Keep real-world scale, sensible origins, PBR materials, GLB exports, and clean animation clips.
- Maintain `spatial` metadata in the DSL: scale, floor/anchor preference, safe bounds, interaction affordances.
- Prepare simple one-object preview modes that can later route to `<model-viewer>` or WebXR.
- Keep textures/materials compatible with glTF PBR rather than engine-only shader hacks.

Do later:

- Add WebXR mode after target-device browser support is validated. MDN still marks WebXR Device API limited availability, secure-context only, and experimental.
- Add model-viewer previews for product/gift objects where static AR display is valuable.
- Evaluate USDZ conversion only if Apple ecosystem AR distribution becomes a product requirement.
- Evaluate OpenXR/native wrapper only if VYBE ships non-browser spatial clients.

## Build-vs-buy/no-cost constraints

Allowed:

- Blender, Three.js, Babylon.js, PixiJS, Khronos glTF tools, JSON Schema, open-source image/audio tools, self-authored assets, CC0/permissive assets with attribution tracking.

Avoid:

- Paid asset marketplaces as required dependencies.
- Paid shader/effect packs as required dependencies.
- Paid cloud rendering or asset optimization APIs.
- Proprietary runtime SDKs that create lock-in for baseline gift playback.

Licensing controls:

- Every asset must carry source, author, license, modification history, and redistribution flag in the asset manifest.
- CI should fail if license metadata is missing.
- Keep attribution output available for settings/legal pages if CC-BY-like content is ever allowed.

## Implementation roadmap

Phase 1 - foundation:

- Create `effects.schema.json` using JSON Schema.
- Implement capability resolver and tiered runtime shell.
- Build one Pixi Tier 1 gift and one Three.js Tier 2 GLB gift.
- Add frame-time and fallback telemetry.

Phase 2 - asset pipeline:

- Standardize Blender export settings.
- Add glTF validation/optimization CLI to CI.
- Produce high/medium/low/poster variants.
- Add manifest generation with byte sizes and declared budgets.

Phase 3 - spectacle library:

- Build reusable templates: confetti burst, coin rain, neon badge, hologram reveal, mascot entrance, portal open/close.
- Add material presets and shader parameter conventions.
- Add editor preview page for designers/operators.

Phase 4 - enhancement:

- Add WebGPU versions only for selected flagship effects.
- Add Babylon Node Material prototype if designer workflow needs it.
- Add model-viewer/WebXR experiments behind feature flags.

## Acceptance checklist for each gift effect

- [ ] DSL validates against schema.
- [ ] Asset manifest has source/license metadata.
- [ ] GLB validates and loads in target engine.
- [ ] Tier 0 fallback exists.
- [ ] Tier 1 or Tier 2 fallback exists if WebGPU enhancement is used.
- [ ] Mobile budget is declared and measured.
- [ ] Reduced-motion behavior is implemented.
- [ ] Context-loss fallback is tested.
- [ ] No paid asset/API dependency.
- [ ] Telemetry keys defined: load_ms, first_frame_ms, avg_frame_ms, dropped_frames, fallback_tier, context_loss, asset_error.

## Source references

1. W3C, WebGPU Candidate Recommendation Draft, 2026-05-21: https://www.w3.org/TR/webgpu/
2. W3C, WebGPU Shading Language Candidate Recommendation Draft, 2026-05-19: https://www.w3.org/TR/WGSL/
3. MDN, WebGPU API: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
4. MDN, WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
5. Khronos, glTF - Runtime 3D Asset Delivery: https://www.khronos.org/gltf/
6. Khronos, glTF 2.0 Specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
7. Blender, LTS releases: https://www.blender.org/download/lts/
8. Blender Manual, glTF 2.0 importer/exporter: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
9. Three.js docs: https://threejs.org/docs/
10. npm, three package observed current version 0.184.0 on 2026-05-24: https://www.npmjs.com/package/three
11. Babylon.js WebGPU Support docs: https://doc.babylonjs.com/setup/support/webGPU
12. npm, @babylonjs/core package observed current version 9.9.1 on 2026-05-24: https://www.npmjs.com/package/@babylonjs/core
13. PixiJS v8 Application guide: https://pixijs.com/8.x/guides/components/application
14. PixiJS API/docs landing, advertising WebGL and WebGPU renderers: https://pixijs.download/release/docs/index.html
15. npm, pixi.js package observed current version 8.18.1 on 2026-05-24: https://www.npmjs.com/package/pixi.js
16. JSON Schema: https://json-schema.org/
17. MDN, WebXR Device API: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
18. Immersive Web: https://immersiveweb.dev/
19. model-viewer: https://modelviewer.dev/
20. WebGPU Samples: https://webgpu.github.io/webgpu-samples/
