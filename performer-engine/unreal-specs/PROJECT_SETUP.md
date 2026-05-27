# Unreal Engine 5 Project Setup: VybePerformer

## Engine Requirements

- Unreal Engine 5.4 or later
- Target platform: Linux (for GPU server deployment) or Windows (for dev)
- Rendering: Deferred, Lumen GI, Nanite (if applicable to environment)
- Resolution: 1920x1080 minimum, 4K optional for premium tier

## Required Plugins (enable in .uproject)

```json
{
  "Plugins": [
    { "Name": "PixelStreaming", "Enabled": true },
    { "Name": "MetaHuman", "Enabled": true },
    { "Name": "ControlRig", "Enabled": true },
    { "Name": "RemoteControl", "Enabled": true },
    { "Name": "RemoteControlAPI", "Enabled": true },
    { "Name": "LiveLink", "Enabled": true },
    { "Name": "HairStrands", "Enabled": true },
    { "Name": "ChaosCloth", "Enabled": true }
  ]
}
```

## Project Folder Structure

```
VybePerformer/
  Content/
    Performers/
      Luna/
        SK_Luna.uasset              (skeletal mesh)
        Luna_PhysicsAsset.uasset    (physics for cloth/ragdoll)
        Luna_AnimBP.uasset          (animation blueprint)
        Luna_ControlRig.uasset      (IK/FK control rig)
        Luna_FaceRig.uasset         (face blend shape driver)
        Luna_Groom.uasset           (hair groom)
        Materials/
          MI_Luna_Skin.uasset
          MI_Luna_Eyes.uasset
          MI_Luna_Hair.uasset
        Garments/
          SK_Luna_Top.uasset
          SK_Luna_Bottom.uasset
          SK_Luna_Shoes.uasset
          (each garment is a separate skeletal mesh, cloth sim enabled)

    Animations/
      Idle/
      Actions/
      Transitions/
      Expressions/
      (see CODEX_BUILD_INSTRUCTIONS.md for full listing)

    Props/
      SM_Prop_ToyA.uasset
      SM_Prop_ToyB.uasset
      (static or skeletal meshes with socket attachment points)

    Environment/
      Room_Default/
        (room geometry, lighting, post-process volume)

    Blueprints/
      BP_PerformerController.uasset   (master controller)
      BP_CameraDirector.uasset        (camera preset manager)
      BP_PropManager.uasset           (prop attach/detach logic)
      BP_WardrobeManager.uasset       (garment show/hide/cloth)
      BP_RemoteCommandReceiver.uasset (WebSocket command parser)

    DataTables/
      DT_Poses.uasset         (pose name -> IK target data)
      DT_Actions.uasset        (action name -> anim sequence ref)
      DT_CameraPresets.uasset  (preset name -> camera transform)
      DT_Expressions.uasset    (expression name -> blend shape map)

  Source/
    VybePerformer/
      VybePerformer.Build.cs
      RemoteCommandReceiver.h
      RemoteCommandReceiver.cpp
      PerformerState.h
      PerformerState.cpp
```

## Animation Blueprint State Machine

```
Entry -> IDLE

IDLE:
  - Plays idle animation montage (breathing, micro-sway, blink, gaze drift)
  - Blend space driven by energy_level (0=relaxed, 1=energetic)
  - Transitions:
    voice_start      -> TALK
    gift_received    -> REACT
    game_event       -> REACT
    action_command   -> PERFORM
    pose_change      -> TRANSITION

TALK:
  - Mouth driven by viseme data from Performer Runtime
  - Body gestures from talk_gesture blend space
  - Blend space driven by voice energy
  - Transitions:
    voice_end + 2s   -> IDLE
    high_priority     -> REACT

REACT:
  - Plays reaction montage (surprise, laugh, celebrate, tease)
  - Selected by reaction_type parameter
  - Transitions:
    montage_complete  -> IDLE
    action_command    -> PERFORM

PERFORM:
  - Plays action sequence from motion library
  - IK targets active for prop interaction
  - Action intensity modulates blend weights
  - Transitions:
    action_complete   -> IDLE
    high_priority     -> (queue, finish current, then handle)

TRANSITION:
  - Blends between two poses using Full Body IK
  - Duration set by blend_seconds parameter
  - Transitions:
    blend_complete    -> IDLE (at new pose)

BLOCKED:
  - Entered when permission check fails
  - Holds current pose, disables new commands
  - Transitions:
    permission_granted -> previous state
    timeout (5s)       -> IDLE
```

## Remote Control API Endpoints

UE5 Remote Control API exposes Blueprint functions via HTTP/WebSocket.
The Performer Runtime connects to `ws://localhost:8765` and calls
functions using the objectPath + functionName pattern.

Each Blueprint actor must be registered with Remote Control:
1. Open the actor in the level
2. Right-click properties/functions -> Expose to Remote Control
3. Verify the objectPath matches what performer_runtime.py expects

## Pixel Streaming Deployment

### Development (local)

```bash
# Start UE5 with Pixel Streaming
./VybePerformer.exe \
  -PixelStreamingURL=ws://localhost:8888 \
  -RenderOffscreen \
  -Windowed \
  -ForceRes -ResX=1920 -ResY=1080 \
  -log

# Start the signaling server (ships with UE5)
node Samples/PixelStreaming/WebServers/SignallingWebServer/cirrus.js \
  --peerConnectionOptions='{"iceServers":[{"urls":"stun:stun.l.google.com:19302"}]}'
```

### Production (GPU cloud server)

Deploy on a cloud GPU instance (AWS g5.xlarge with A10G, or similar):

```bash
# Headless Linux build
./VybePerformer-Linux-Shipping \
  -PixelStreamingURL=ws://0.0.0.0:8888 \
  -RenderOffscreen \
  -ForceRes -ResX=1920 -ResY=1080 \
  -nosound \
  -log

# Run signaling server behind HTTPS/WSS reverse proxy (nginx)
# Run TURN server for NAT traversal (coturn)
```

Each concurrent viewer stream requires roughly:
- 1 UE5 instance per performer (not per viewer)
- Pixel Streaming multiplexes to multiple viewers from one render
- GPU: 4-8 GB VRAM depending on scene complexity
- CPU: 4 cores minimum
- Network: ~5 Mbps per viewer at 1080p
