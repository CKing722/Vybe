import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def protocol_values(message_type: str, field: str) -> set[str]:
    protocol = json.loads((ROOT / "protocols" / "muse-performer-protocol.json").read_text(encoding="utf-8"))
    value = protocol["messageTypes"][message_type]["schema"][field]
    if not isinstance(value, str) or "|" not in value:
        return set()
    return {
        item.strip()
        for item in re.split(r"\|", value)
        if item.strip() and " " not in item.strip()
    }


class MotionManifestTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((ROOT / "motion-library" / "motion_manifest.json").read_text(encoding="utf-8"))

    def test_protocol_poses_have_manifest_entries(self):
        protocol_poses = protocol_values("performer.pose", "pose")
        manifest_poses = {pose["id"] for pose in self.manifest["poses"]}

        self.assertTrue(protocol_poses)
        self.assertTrue(protocol_poses.issubset(manifest_poses))

    def test_protocol_cameras_have_manifest_entries(self):
        protocol_cameras = protocol_values("performer.camera", "preset")
        manifest_cameras = set(self.manifest["cameras"])

        self.assertTrue(protocol_cameras)
        self.assertTrue(protocol_cameras.issubset(manifest_cameras))

    def test_required_actions_have_permission_keys_and_asset_paths(self):
        for action in self.manifest["actions"]:
            self.assertRegex(action["id"], r"^[a-z0-9_]+$")
            self.assertIn(action["permission"], {"public", "private", "vip", "explicit", "prop_approved"})
            self.assertTrue(action["assetPath"].startswith("/Game/Animations/Actions/"))

    def test_manifest_marks_assets_as_required_not_complete(self):
        self.assertEqual(self.manifest["assetStatus"], "manifest_only_assets_required")
        self.assertEqual(self.manifest["transitionPolicy"]["requiredPoseToPoseTransitions"], "all_pose_pairs")
        self.assertTrue(self.manifest["qaRequirements"]["requiresPermissionKeyForEveryAction"])


if __name__ == "__main__":
    unittest.main()
