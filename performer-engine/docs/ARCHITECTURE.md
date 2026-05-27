# VYBE Performer Engine: Complete Technical Architecture

## System Overview

The Performer Engine is a real-time AI-controlled character animation system.
It connects the MUSE intelligence layer (AI brain) to an Unreal Engine 5
renderer, streams the output via Pixel Streaming (WebRTC) to the vybe-live
React frontend, and embeds it in the performer's live room.

```
┌─────────────────────────────────────────────────────────┐
│  VIEWER BROWSER (vybe-live React app)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <VybePerformerStream />                          │  │
│  │  - Receives WebRTC video from Pixel Streaming     │  │
│  │  - Sends viewer events (chat, gifts, game) up     │  │
│  │  - Overlays UI (chat, games, gifts) on top        │  │
│  └──────────────────────┬────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │ WebRTC (video down, events up)
┌─────────────────────────┼───────────────────────────────┐
│  GPU SERVER                                             │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │  UNREAL ENGINE 5 (Pixel Streaming enabled)        │  │
│  │  - MetaHuman performer model                      │  │
│  │  - Skeletal mesh + IK + cloth + hair              │  │
│  │  - Animation Blueprint (state machine)            │  │
│  │  - Camera system                                  │  │
│  │  - Prop system                                    │  │
│  │  - Lighting / environment                         │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │ WebSocket (localhost:8765)     │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │  PERFORMER RUNTIME (Python, runs on same server)  │  │
│  │  - Translates MUSE commands to UE5 actions        │  │
│  │  - Manages animation state machine                │  │
│  │  - Enforces consent/permission gates              │  │
│  │  - Syncs voice audio to mouth blend shapes        │  │
│  │  - Tracks prop state and contact zones            │  │
│  └──────────────────────┬────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │ WebSocket (secure, remote)
┌─────────────────────────┼───────────────────────────────┐
│  MUSE SERVER (can be separate machine)                  │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │  MUSE ORCHESTRATOR                                │  │
│  │  - Claude Opus (director, tool-use)               │  │
│  │  - Claude Sonnet (conversation)                   │  │
│  │  - ElevenLabs v3 (voice synthesis)                │  │
│  │  - Neo4j (viewer memory)                          │  │
│  │  - Thompson Sampler (content optimization)        │  │
│  │  - Game engine integration                        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Unreal Engine 5 Renderer

**Project name:** `VybePerformer`
**Engine version:** 5.4+
**Required plugins:** MetaHuman, Pixel Streaming, Live Link, Control Rig

**Character setup:**
- MetaHuman base or custom skeletal mesh
- Full body skeleton (root, pelvis, spine_01-03, neck, head, clavicle L/R,
  upperarm L/R, lowerarm L/R, hand L/R, thigh L/R, calf L/R, foot L/R,
  plus finger bones and face board)
- IK rigs: Full Body IK for pose targeting, Hand IK for prop interaction
- Cloth simulation on removable garment meshes
- Groom component for hair dynamics
- Morph targets / blend shapes for facial expression (ARKit compatible)
- Prop sockets: right_hand, left_hand, plus custom attachment points

**Animation Blueprint states:**
```
IDLE        -> TALK        (on: voice_start)
IDLE        -> REACT       (on: gift_received | game_event)
IDLE        -> PERFORM     (on: action_command)
IDLE        -> TRANSITION  (on: pose_change)
TALK        -> IDLE        (on: voice_end + 2s)
TALK        -> REACT       (on: high_priority_event)
REACT       -> IDLE        (on: reaction_complete)
REACT       -> PERFORM     (on: action_command)
PERFORM     -> IDLE        (on: action_complete)
PERFORM     -> REACT       (on: high_priority_event)
TRANSITION  -> IDLE        (on: pose_reached)
ANY         -> BLOCKED     (on: permission_denied)
```

**Pose library (target poses the IK system blends between):**
```
standing_neutral    standing_hip
seated_relaxed      seated_forward
recline_back        recline_side
kneel_upright       kneel_forward
closeup_face        closeup_upper
```

**Camera presets:**
```
cam_wide        - full body, environment visible
cam_medium      - waist up
cam_closeup     - shoulders up
cam_detail      - configurable focus point
cam_dynamic     - slow orbit or drift
cam_reaction    - snap to face on events
```

**Pixel Streaming config:**
```
-PixelStreamingURL=ws://localhost:8888
-RenderOffscreen
-Windowed
-ForceRes
-ResX=1920
-ResY=1080
-GraphicsAdapter=0
```

### 2. Performer Runtime (Python bridge)

**Location:** Runs on the same GPU server as Unreal.
**Role:** Translates high-level MUSE commands into specific Unreal actions.

**Inbound (from MUSE):** WebSocket on configurable port (default 9000).
**Outbound (to Unreal):** WebSocket on localhost:8765 using UE5 Remote Control.

**Core responsibilities:**
- Parse MUSE command messages (JSON)
- Validate every action against the performer permission profile
- Map action commands to animation clip names + IK targets
- Manage prop attachment/detachment state
- Sync ElevenLabs audio stream timing to mouth blend shapes
- Send camera commands based on action context
- Report state back to MUSE (current pose, energy level, action queue)

### 3. React Integration (vybe-live frontend)

**Component:** `<VybePerformerStream />`
**Role:** Embeds the Pixel Streaming WebRTC output inside the live room.

**Behavior:**
- Connects to the Pixel Streaming signaling server
- Displays the live rendered video as the room background
- Overlays the existing vybe-live UI (chat, games, gifts, action bar)
- Forwards viewer events (chat messages, gift events, game events) to MUSE
- Handles connection lifecycle (connect, reconnect, quality adaptation)

### 4. MUSE Orchestrator

**Existing architecture from MUSE spec.** Sends commands to Performer Runtime.
Commands are JSON messages over WebSocket. Protocol defined in
`protocols/muse-performer-protocol.json`.
