# VybePerformer UE5 Scaffold

This folder is a source-control scaffold for the UE5 renderer project. It does
not contain MetaHuman assets, animation clips, maps, groom data, garments, or
props. Those must be authored or imported inside Unreal Engine 5.4+.

## What Is Included

- `VybePerformer.uproject` with required renderer/control plugins enabled.
- `Config/DefaultEngine.ini` with Pixel Streaming and project defaults.
- C++ module and target files.
- Blueprint-callable function signatures matching
  `../contracts/unreal-remote-control-contract.json`.

## Required UE5 Work

1. Open `VybePerformer.uproject` in UE5.4+.
2. Create the `Content/` structure described in `../unreal-specs/PROJECT_SETUP.md`.
3. Import or create the performer MetaHuman/custom skeletal mesh.
4. Build the Animation Blueprint, Control Rig, Face Rig, Camera Director, Prop Manager, and Wardrobe Manager.
5. Expose every contract function to Remote Control with the exact object paths in the contract JSON.
6. Run Pixel Streaming and validate the browser at `/?vybePreview=room&signalingUrl=...`.
