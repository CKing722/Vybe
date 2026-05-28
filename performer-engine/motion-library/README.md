# Motion Library Manifest

This folder defines the required motion coverage for the UE5 performer. It is
not a substitute for real animation assets; it is the acceptance contract for
the animation team and for automated validation once assets are imported.

## Rules

- Every action must have a permission key.
- Every protocol pose must exist in the pose list.
- Every protocol camera preset must exist in the camera list.
- Pose transitions must cover the complete graph: every valid base pose can
  blend to every other valid base pose without snapping or mesh collapse.
- Prop interactions must be authored as real skeletal/IK clips, not generated
  by frontend transforms or image manipulation.
- Facial expressions must be driven by UE5 blend shapes/Control Rig and checked
  against voice visemes.

## Asset Status

`motion_manifest.json` currently marks the library as
`manifest_only_assets_required`. The status should not be changed until actual
UE5 animation assets exist at the listed paths and pass the QA checklist.
