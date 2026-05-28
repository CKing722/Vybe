import asyncio
import json
import sys
import unittest
from pathlib import Path

import websockets

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "muse-bridge"))
sys.path.insert(0, str(ROOT / "tools"))

import mock_unreal_remote
import performer_runtime as runtime


class UnrealRemoteContractTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.contract_path = ROOT / "contracts" / "unreal-remote-control-contract.json"
        self.contract = mock_unreal_remote.load_contract(self.contract_path)

    async def test_runtime_unreal_commands_match_contract(self):
        bridge = runtime.UnrealBridge(dry_run=True)

        await bridge.set_pose("standing_neutral", 0.25)
        await bridge.play_action("wave_to_room", 0.4, False)
        await bridge.set_expression("smile", 0.5, 0.2)
        await bridge.attach_prop("prop_toy_a", "right_hand")
        await bridge.detach_prop("prop_toy_a")
        await bridge.activate_prop("prop_toy_a")
        await bridge.deactivate_prop("prop_toy_a")
        await bridge.set_camera("cam_medium", 0.5)
        await bridge.set_wardrobe("stage_layer", "on")
        await bridge.set_look_at("camera", 0.7)
        await bridge.set_idle(1.0, 0.2, 0.3)
        await bridge.send({
            "objectPath": "/Game/Performer/FaceRig.FaceRig",
            "functionName": "ProcessVisemes",
            "parameters": {"AudioURL": "local://voice.wav", "Visemes": [], "BodyEnergy": 0.4},
        })

        for command in bridge.sent_commands:
            valid, reason = mock_unreal_remote.validate_command(self.contract, command)
            self.assertTrue(valid, f"{command['functionName']} failed contract: {reason}")

    async def test_mock_unreal_rejects_unknown_function(self):
        valid, reason = mock_unreal_remote.validate_command(self.contract, {
            "objectPath": "/Game/Performer/AnimBP.AnimBP",
            "functionName": "UnknownFunction",
            "parameters": {},
        })

        self.assertFalse(valid)
        self.assertIn("unknown functionName", reason)

    async def test_runtime_can_send_to_mock_unreal_websocket(self):
        received = []
        ready = asyncio.Event()

        async def handler(ws):
            raw = await ws.recv()
            command = json.loads(raw)
            valid, reason = mock_unreal_remote.validate_command(self.contract, command)
            received.append((command, valid, reason))
            await ws.send(json.dumps({"type": "mock_unreal.ack", "valid": valid, "reason": reason}))
            ready.set()

        async with websockets.serve(handler, "127.0.0.1", 0) as server:
            port = server.sockets[0].getsockname()[1]
            bridge = runtime.UnrealBridge(host="127.0.0.1", port=port)
            await bridge.connect()
            await bridge.set_pose("standing_neutral", 0.25)
            await ready.wait()
            await bridge.close()

        self.assertEqual(received[0][0]["functionName"], "SetTargetPose")
        self.assertTrue(received[0][1], received[0][2])

    async def test_unreal_project_declares_required_plugins(self):
        project = json.loads((ROOT / "unreal-project" / "VybePerformer.uproject").read_text(encoding="utf-8"))
        plugins = {plugin["Name"] for plugin in project["Plugins"] if plugin.get("Enabled")}

        for required in {
            "PixelStreaming",
            "MetaHuman",
            "ControlRig",
            "RemoteControl",
            "RemoteControlAPI",
            "LiveLink",
            "HairStrands",
            "ChaosCloth",
        }:
            self.assertIn(required, plugins)


if __name__ == "__main__":
    unittest.main()
