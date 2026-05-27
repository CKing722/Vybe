# CODEX BUILD INSTRUCTIONS
# VYBE Performer Engine Integration

## READ THIS FIRST

You are building the real-time AI performer rendering system for VYBE.
This is NOT a 2D image animation system. Do NOT slice images into layers.
Do NOT apply CSS transforms to photographs.

The performer is a 3D rigged character rendered in Unreal Engine 5.
The website receives a live video stream via WebRTC (Pixel Streaming).
The website overlays its UI (chat, games, gifts) on top of that video.

## FILES PROVIDED

```
vybe-performer-engine/
  docs/
    ARCHITECTURE.md          <- System overview, read first
  protocols/
    muse-performer-protocol.json  <- WebSocket message schemas
  src/
    muse-bridge/
      performer_runtime.py   <- Python bridge (MUSE <-> Unreal)
    react-integration/
      VybePerformerStream.jsx <- React component for vybe-live
    unreal-specs/
      PROJECT_SETUP.md       <- Unreal project structure
```

## PHASE 1: Website Integration (do this first)

### Step 1: Install Pixel Streaming frontend dependency

```bash
cd vybe-live
npm install @epicgames-ps/lib-pixelstreamingfrontend-ui
npm install @epicgames-ps/lib-pixelstreamingfrontend
```

If these packages fail to install (they require specific npm registry
config), the VybePerformerStream component includes a built-in fallback
that connects via raw WebRTC. It will still work.

### Step 2: Add VybePerformerStream to the project

Copy `src/react-integration/VybePerformerStream.jsx` into
`vybe-live/src/components/VybePerformerStream.jsx`

### Step 3: Integrate into the live room

In the live room component (where the performer video currently shows),
replace the static image or video element with:

```jsx
import VybePerformerStream from "./components/VybePerformerStream";

// Inside the live room render:
<VybePerformerStream
  signalingUrl="ws://your-gpu-server:8888"
  museUrl="ws://your-muse-server:9000"
  performerId={performer.id}
  roomId={room.id}
  onStreamReady={() => console.log("Performer stream live")}
>
  {({ sendViewerEvent, status }) => (
    <>
      {/* Existing room UI renders here, on top of the stream */}
      <ChatPanel onSend={(msg) => sendViewerEvent("chat", { message: msg })} />
      <GiftPanel onGift={(gift) => sendViewerEvent("gift", gift)} />
      <GamePanel onAction={(action) => sendViewerEvent("game_action", action)} />
      <ActionBar />
    </>
  )}
</VybePerformerStream>
```

The video stream fills the background. All UI overlays on top.
The `sendViewerEvent` function forwards viewer actions to MUSE.

### Step 4: Dev mode (before Unreal is ready)

Until the Unreal renderer is running, the component will show
"Connecting to performer..." and retry. To develop the UI overlay
without a live stream, add a fallback:

```jsx
// Temporary: use a looping video file as placeholder
{status !== "streaming" && (
  <video
    src="/assets/performer-placeholder.mp4"
    autoPlay loop muted playsInline
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
  />
)}
```

## PHASE 2: Performer Runtime (Python backend)

### Step 1: Set up the runtime server

```bash
cd vybe-performer-engine/src/muse-bridge
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install websockets
```

### Step 2: Configure the performer profile

Edit the `main()` function in `performer_runtime.py` to load the
performer profile from a JSON config file instead of hardcoded values.

Example config (`performers/luna.json`):
```json
{
  "performer_id": "luna_001",
  "display_name": "Luna",
  "allowed_permissions": ["public", "private", "vip", "explicit", "prop_approved"],
  "blocked_actions": [],
  "approved_props": ["prop_toy_a", "prop_toy_b", "prop_toy_c"],
  "max_intensity": 1.0
}
```

### Step 3: Run the runtime

```bash
python performer_runtime.py
```

It will wait for both Unreal Engine (localhost:8765) and MUSE (inbound
on port 9000) to connect.

## PHASE 3: Unreal Engine 5 Project

### Step 1: Create the UE5 project

- Open Unreal Engine 5.4+
- Create new project: Games > Blank > C++
- Name: VybePerformer
- Enable plugins: MetaHuman, Pixel Streaming, Control Rig, Remote Control API

### Step 2: Character setup

- Create or import a MetaHuman performer character
- Set up the skeletal mesh with Full Body IK
- Add prop sockets to the skeleton: right_hand, left_hand, custom points
- Add cloth simulation components for removable garments
- Add groom component for hair dynamics
- Set up face rig with ARKit-compatible blend shapes

### Step 3: Animation Blueprint

Create an Animation Blueprint with the state machine defined in
ARCHITECTURE.md. States: IDLE, TALK, REACT, PERFORM, TRANSITION, BLOCKED.

The Animation Blueprint receives commands from the Remote Control API
(WebSocket on localhost:8765). The Performer Runtime sends commands
using the object paths defined in performer_runtime.py.

Key Blueprint functions to implement:
- SetTargetPose(PoseName, BlendTime)
- PlayActionClip(ClipName, Intensity, Loop)
- SetExpression(Expression, Intensity, BlendTime)
- AttachProp(PropId, Socket)
- DetachProp(PropId)
- SetPreset(Preset, TransitionTime) [on CameraDirector]
- SetGarmentState(GarmentId, State) [on WardrobeManager]
- SetLookAt(Target, Intensity) [on FaceRig]
- SetIdleBehavior(BreathingRate, SwayAmount, Energy)
- ProcessVisemes(AudioURL, Visemes, BodyEnergy) [on FaceRig]

### Step 4: Motion library

The motion library is a folder of animation sequences:
```
Content/
  Animations/
    Idle/
      idle_standing_neutral.uasset
      idle_seated_relaxed.uasset
      idle_breathing_variants.uasset
    Actions/
      action_react_surprise.uasset
      action_react_laugh.uasset
      action_celebrate.uasset
      action_wave.uasset
      action_lean_forward.uasset
      ... (extend with performer-specific clips)
    Transitions/
      trans_stand_to_seated.uasset
      trans_seated_to_recline.uasset
      trans_recline_to_kneel.uasset
      ... (every valid pose-to-pose transition)
    Expressions/
      expr_smile.uasset
      expr_surprise.uasset
      expr_laugh.uasset
      ... (face animation curves)
```

These can be created from:
1. Motion capture retargeted to the MetaHuman skeleton
2. Procedural animation generated in Control Rig
3. Imported from animation marketplaces (Mixamo, ActorCore, Reallusion)

### Step 5: Pixel Streaming

Configure the project to run in Pixel Streaming mode:

```
Launch args:
  -PixelStreamingURL=ws://localhost:8888
  -RenderOffscreen
  -Windowed
  -ForceRes -ResX=1920 -ResY=1080
```

The Pixel Streaming signaling server runs alongside UE5 and handles
WebRTC negotiation with the viewer's browser.

### Step 6: Camera Director

Create a CameraDirector Blueprint that manages camera angles:
- cam_wide: full body shot
- cam_medium: waist up
- cam_closeup: shoulders/face
- cam_detail: programmable focus point
- cam_dynamic: slow automated movement
- cam_reaction: snap to face on events

Camera transitions use CineCameraActor with smooth interpolation.

## PHASE 4: MUSE Integration

The MUSE orchestrator (Claude Opus + Sonnet + ElevenLabs + Neo4j)
connects to the Performer Runtime on port 9000 and sends commands
using the protocol defined in muse-performer-protocol.json.

This phase connects the AI brain to the rendering body.
The MUSE architecture is defined in the separate MUSE spec document.

## WHAT NOT TO DO

- Do NOT animate 2D images. No CSS transforms on photographs.
- Do NOT use canvas 2D for character rendering.
- Do NOT use Three.js for the performer (use UE5 Pixel Streaming).
- Do NOT build a custom WebGL renderer. UE5 handles rendering.
- Do NOT try to generate video frames with AI diffusion models (too slow).
- Do NOT use any third-party avatar API (HeyGen, D-ID, Synthesia)
  as they prohibit adult content in their ToS.

## BUILD ORDER

1. Get VybePerformerStream component working in vybe-live with a
   placeholder video (proves the UI overlay architecture works)
2. Get the Performer Runtime running and accepting WebSocket commands
3. Get UE5 project created with MetaHuman and Pixel Streaming
4. Connect browser to UE5 via Pixel Streaming (proves the video pipe)
5. Connect Performer Runtime to UE5 via Remote Control API
6. Connect MUSE to Performer Runtime (proves the AI control loop)
7. Build out the motion library and action clips
8. Iterate on realism, timing, and expression quality
