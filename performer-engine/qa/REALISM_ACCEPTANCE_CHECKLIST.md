# Realism Acceptance Checklist

This checklist gates the project before the AI performer can be presented as a
realistic human renderer.

## Body And Pose

- Every protocol pose reaches target without mesh collapse, foot sliding, broken shoulders, broken wrists, or knee/elbow popping.
- Every pose-to-pose transition blends cleanly at 0.25s, 1.0s, and 3.0s.
- Hands maintain believable contact during approved prop interactions.
- Fingers, wrists, elbows, shoulders, pelvis, knees, ankles, neck, jaw, and eyes are reviewed in close camera.
- Idle animation includes breathing, gaze drift, blink variation, and subtle weight shifts.

## Face And Voice

- Mouth visemes stay within 80ms of the audio timing.
- Eyebrows, eyelids, cheeks, jaw, and gaze match the selected expression.
- Speech, reactions, and idle expressions blend without snapping.
- Voice energy maps to body energy without overacting.

## Hair, Cloth, Camera

- Groom/hair simulation remains stable across idle, turns, recline, kneel, and close camera.
- Cloth and wardrobe state changes do not clip through skin during transitions.
- Camera presets never hide required action context or produce unsafe occlusion.
- Pixel Streaming output holds 60fps target on the deployment GPU profile.

## Runtime And Permissions

- Every action clip has a permission key in the motion manifest.
- Runtime denies blocked actions and unavailable permission levels before sending commands to UE5.
- Props cannot attach, activate, or remain active unless approved in the performer profile.
- Permission denials return to MUSE and do not trigger retry loops.

## Long Session

- One-hour idle-plus-interaction session runs without memory growth, animation drift, audio drift, or WebRTC disconnect loops.
- Reconnect preserves room UI and resumes the renderer without returning to any fake frontend animation fallback.
