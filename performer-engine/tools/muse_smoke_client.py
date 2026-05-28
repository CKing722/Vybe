"""
Small MUSE-side smoke client for the Performer Runtime.

Use this after starting performer_runtime.py to verify command/response flow:
  python tools/muse_smoke_client.py --runtime ws://127.0.0.1:9000
"""

import argparse
import asyncio
import json

import websockets


SMOKE_SEQUENCE = [
    {"type": "performer.pose", "pose": "standing_neutral", "blend_seconds": 0.25},
    {"type": "performer.expression", "expression": "smile", "intensity": 0.55, "blend_seconds": 0.2},
    {"type": "performer.action", "action_id": "wave_to_room", "intensity": 0.45, "requires_permission": "public"},
    {"type": "performer.camera", "preset": "cam_medium", "transition_seconds": 0.5},
    {"type": "performer.prop", "prop_id": "prop_toy_a", "action": "attach", "socket": "right_hand", "requires_permission": "prop_approved"},
    {"type": "performer.action", "action_id": "restricted_motion_check", "intensity": 0.4, "requires_permission": "explicit"},
]


async def run_smoke(runtime_url: str):
    async with websockets.connect(runtime_url) as ws:
        initial = json.loads(await ws.recv())
        print(json.dumps({"initial": initial}, indent=2))

        for command in SMOKE_SEQUENCE:
            await ws.send(json.dumps(command))
            responses = [json.loads(await ws.recv())]
            if responses[0].get("type") != "performer.state_report":
                responses.append(json.loads(await ws.recv()))
            print(json.dumps({"command": command, "responses": responses}, indent=2))


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run MUSE smoke commands against Performer Runtime")
    parser.add_argument("--runtime", default="ws://127.0.0.1:9000")
    return parser


if __name__ == "__main__":
    args = build_arg_parser().parse_args()
    asyncio.run(run_smoke(args.runtime))
