"""
Mock UE5 Remote Control WebSocket server.

This is not a renderer. It validates the exact command envelope the Performer
Runtime sends to Unreal so Phase 5 can be tested before the UE5 editor exists.
"""

import argparse
import asyncio
import json
from pathlib import Path

import websockets


def load_contract(path: str | Path) -> dict:
    with Path(path).open("r", encoding="utf-8") as contract_file:
        return json.load(contract_file)


def validate_type(expected: str, value) -> bool:
    if expected == "string":
        return isinstance(value, str)
    if expected == "bool":
        return isinstance(value, bool)
    if expected == "array":
        return isinstance(value, list)
    if expected == "float":
        return isinstance(value, (int, float))
    if expected == "float_0_1":
        return isinstance(value, (int, float)) and 0 <= float(value) <= 1
    return False


def validate_command(contract: dict, command: dict) -> tuple[bool, str]:
    object_path = command.get("objectPath")
    function_name = command.get("functionName")
    parameters = command.get("parameters", {})

    object_contract = contract.get("objects", {}).get(object_path)
    if not object_contract:
        return False, f"unknown objectPath: {object_path}"

    function_contract = object_contract.get("functions", {}).get(function_name)
    if not function_contract:
        return False, f"unknown functionName for {object_path}: {function_name}"

    expected_parameters = function_contract.get("parameters", {})
    missing = sorted(set(expected_parameters) - set(parameters))
    extra = sorted(set(parameters) - set(expected_parameters))
    if missing:
        return False, f"missing parameters for {function_name}: {', '.join(missing)}"
    if extra:
        return False, f"unexpected parameters for {function_name}: {', '.join(extra)}"

    for key, expected_type in expected_parameters.items():
        if not validate_type(expected_type, parameters.get(key)):
            return False, f"parameter {key} failed type {expected_type}"

    return True, "ok"


async def serve_mock(host: str, port: int, contract_path: str | Path, stop_after: int | None = None):
    contract = load_contract(contract_path)
    state = {"commands": []}
    stop_event = asyncio.Event()

    async def handler(ws):
        async for raw in ws:
            try:
                command = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send(json.dumps({"type": "mock_unreal.error", "reason": "invalid JSON"}))
                continue

            valid, reason = validate_command(contract, command)
            state["commands"].append({"valid": valid, "reason": reason, "command": command})
            await ws.send(json.dumps({
                "type": "mock_unreal.ack" if valid else "mock_unreal.error",
                "valid": valid,
                "reason": reason,
                "functionName": command.get("functionName"),
            }))
            if stop_after and len(state["commands"]) >= stop_after:
                stop_event.set()

    async with websockets.serve(handler, host, port):
        if stop_after:
            await stop_event.wait()
        else:
            await asyncio.Future()

    return state


def build_arg_parser() -> argparse.ArgumentParser:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Run a mock UE5 Remote Control WebSocket server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--contract", default=str(root / "contracts" / "unreal-remote-control-contract.json"))
    parser.add_argument("--stop-after", type=int, default=None)
    return parser


if __name__ == "__main__":
    args = build_arg_parser().parse_args()
    asyncio.run(serve_mock(args.host, args.port, args.contract, args.stop_after))
