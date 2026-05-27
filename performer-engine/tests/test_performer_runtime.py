import json
import sys
import unittest
from pathlib import Path

import websockets

RUNTIME_PATH = Path(__file__).resolve().parents[1] / "muse-bridge"
sys.path.insert(0, str(RUNTIME_PATH))

import performer_runtime as runtime


class PerformerRuntimeTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
      self.profile = runtime.PerformerProfile(
          performer_id="luna_001",
          display_name="Luna",
          allowed_permissions={
              runtime.PermissionLevel.PUBLIC,
              runtime.PermissionLevel.PRIVATE,
              runtime.PermissionLevel.VIP,
              runtime.PermissionLevel.PROP_APPROVED,
          },
          blocked_actions={"blocked_motion_clip"},
          approved_props={"prop_toy_a", "prop_camera_focus"},
          max_intensity=0.6,
      )
      self.state = runtime.PerformerState()
      self.bridge = runtime.UnrealBridge(dry_run=True)
      self.handler = runtime.CommandHandler(self.profile, self.state, self.bridge)

    async def test_loads_profile_from_json(self):
        profile_path = Path(__file__).resolve().parents[1] / "performers" / "luna.json"
        profile = runtime.load_profile(profile_path)

        self.assertEqual(profile.performer_id, "luna_001")
        self.assertIn(runtime.PermissionLevel.PROP_APPROVED, profile.allowed_permissions)
        self.assertTrue(profile.prop_allowed("prop_toy_a"))
        self.assertLessEqual(profile.max_intensity, 1.0)

    async def test_pose_command_updates_state_and_unreal_command(self):
        result = await self.handler.handle({
            "type": "performer.pose",
            "pose": "seated_relaxed",
            "blend_seconds": 1.25,
        })

        self.assertIsNone(result)
        self.assertEqual(self.state.current_pose, "seated_relaxed")
        self.assertEqual(self.bridge.sent_commands[-1]["functionName"], "SetTargetPose")
        self.assertEqual(self.bridge.sent_commands[-1]["parameters"]["BlendTime"], 1.25)

    async def test_action_permission_gate_blocks_missing_permission(self):
        result = await self.handler.handle({
            "type": "performer.action",
            "action_id": "premium_motion_clip",
            "intensity": 0.4,
            "requires_permission": "explicit",
        })

        self.assertEqual(result["type"], "performer.permission_denied")
        self.assertEqual(result["required_permission"], "explicit")
        self.assertEqual(self.state.last_permission_block, "explicit")
        self.assertEqual(self.bridge.sent_commands, [])

    async def test_action_blocklist_and_intensity_clamp(self):
        blocked = await self.handler.handle({
            "type": "performer.action",
            "action_id": "blocked_motion_clip",
            "requires_permission": "public",
        })
        self.assertEqual(blocked["type"], "performer.permission_denied")
        self.assertEqual(self.bridge.sent_commands, [])

        allowed = await self.handler.handle({
            "type": "performer.action",
            "action_id": "wave_to_room",
            "intensity": 1.0,
            "loop": True,
            "requires_permission": "public",
        })
        self.assertIsNone(allowed)
        command = self.bridge.sent_commands[-1]
        self.assertEqual(command["functionName"], "PlayActionClip")
        self.assertEqual(command["parameters"]["Intensity"], 0.6)
        self.assertTrue(command["parameters"]["Loop"])

    async def test_prop_permission_and_approval_gate(self):
        denied = await self.handler.handle({
            "type": "performer.prop",
            "prop_id": "unapproved_prop",
            "action": "attach",
            "requires_permission": "prop_approved",
        })
        self.assertEqual(denied["type"], "performer.permission_denied")
        self.assertEqual(self.bridge.sent_commands, [])

        attached = await self.handler.handle({
            "type": "performer.prop",
            "prop_id": "prop_toy_a",
            "action": "attach",
            "socket": "right_hand",
            "requires_permission": "prop_approved",
        })
        self.assertIsNone(attached)
        self.assertIn("prop_toy_a", self.state.active_props)
        self.assertEqual(self.bridge.sent_commands[-1]["functionName"], "AttachProp")

        activated = await self.handler.handle({
            "type": "performer.prop",
            "prop_id": "prop_toy_a",
            "action": "activate",
            "requires_permission": "prop_approved",
        })
        self.assertIsNone(activated)
        self.assertEqual(self.bridge.sent_commands[-1]["functionName"], "ActivateProp")

        detached = await self.handler.handle({
            "type": "performer.prop",
            "prop_id": "prop_toy_a",
            "action": "detach",
            "requires_permission": "prop_approved",
        })
        self.assertIsNone(detached)
        self.assertNotIn("prop_toy_a", self.state.active_props)
        self.assertEqual(self.bridge.sent_commands[-1]["functionName"], "DetachProp")

    async def test_expression_camera_wardrobe_look_idle_and_voice_sync(self):
        await self.handler.handle({"type": "performer.expression", "expression": "smile", "intensity": 2})
        await self.handler.handle({"type": "performer.camera", "preset": "cam_closeup", "transition_seconds": 0.5})
        await self.handler.handle({
            "type": "performer.wardrobe",
            "garment_id": "stage_layer",
            "state": "on",
            "requires_permission": "public",
        })
        await self.handler.handle({"type": "performer.look_at", "target": "camera", "intensity": 0.9})
        await self.handler.handle({"type": "performer.idle_behavior", "breathing_rate": 1.1, "sway_amount": 0.2, "energy_level": 1.8})
        await self.handler.handle({
            "type": "performer.voice_sync",
            "audio_url": "https://example.test/audio.wav",
            "viseme_data": [{"time_ms": 0, "viseme": "A", "weight": 1}],
            "body_energy": 0.4,
        })

        names = [command["functionName"] for command in self.bridge.sent_commands]
        self.assertEqual(
            names,
            ["SetExpression", "SetPreset", "SetGarmentState", "SetLookAt", "SetIdleBehavior", "ProcessVisemes"],
        )
        self.assertEqual(self.state.camera_preset, "cam_closeup")
        self.assertEqual(self.state.wardrobe_state["stage_layer"], "on")
        self.assertEqual(self.state.energy_level, 1.0)

    async def test_websocket_command_response_cycle(self):
        async with websockets.serve(
            lambda ws: runtime.muse_handler(ws, self.handler, self.state),
            "127.0.0.1",
            0,
        ) as server:
            port = server.sockets[0].getsockname()[1]
            async with websockets.connect(f"ws://127.0.0.1:{port}") as client:
                initial = json.loads(await client.recv())
                self.assertEqual(initial["type"], "performer.state_report")

                await client.send(json.dumps({
                    "type": "performer.action",
                    "action_id": "wave_to_room",
                    "intensity": 0.2,
                    "requires_permission": "public",
                }))
                state_report = json.loads(await client.recv())
                self.assertEqual(state_report["current_action"], "wave_to_room")

                await client.send(json.dumps({
                    "type": "performer.action",
                    "action_id": "blocked_private_clip",
                    "requires_permission": "explicit",
                }))
                denial = json.loads(await client.recv())
                next_state = json.loads(await client.recv())
                self.assertEqual(denial["type"], "performer.permission_denied")
                self.assertEqual(next_state["last_permission_block"], "explicit")


if __name__ == "__main__":
    unittest.main()
