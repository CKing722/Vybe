"""
VYBE Performer Runtime
Bridges MUSE orchestrator commands to Unreal Engine 5 animation actions.

Inbound:  WebSocket from MUSE (default ws://0.0.0.0:9000)
Outbound: WebSocket to UE5 Remote Control (default ws://localhost:8765)
"""

import argparse
import asyncio
import json
import logging
import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("performer-runtime")


class PermissionLevel(Enum):
    """Gates that must be unlocked before actions execute."""

    PUBLIC = "public"
    PRIVATE = "private"
    VIP = "vip"
    EXPLICIT = "explicit"
    PROP_APPROVED = "prop_approved"


@dataclass
class PerformerProfile:
    """Defines what this specific performer allows. Loaded from config."""

    performer_id: str
    display_name: str
    allowed_permissions: set[PermissionLevel] = field(default_factory=lambda: {PermissionLevel.PUBLIC})
    blocked_actions: set[str] = field(default_factory=set)
    approved_props: set[str] = field(default_factory=set)
    max_intensity: float = 1.0

    @classmethod
    def from_dict(cls, data: dict) -> "PerformerProfile":
        permissions = set()
        for value in data.get("allowed_permissions", ["public"]):
            try:
                permissions.add(PermissionLevel(value))
            except ValueError:
                log.warning("Ignoring unknown permission in performer profile: %s", value)

        max_intensity = max(0.0, min(1.0, float(data.get("max_intensity", 1.0))))
        return cls(
            performer_id=str(data["performer_id"]),
            display_name=str(data.get("display_name", data["performer_id"])),
            allowed_permissions=permissions or {PermissionLevel.PUBLIC},
            blocked_actions=set(data.get("blocked_actions", [])),
            approved_props=set(data.get("approved_props", [])),
            max_intensity=max_intensity,
        )

    def permits(self, permission_key: str | None) -> bool:
        if not permission_key:
            return True
        try:
            required = PermissionLevel(permission_key)
        except ValueError:
            return False
        return required in self.allowed_permissions

    def action_allowed(self, action_id: str) -> bool:
        return action_id not in self.blocked_actions

    def prop_allowed(self, prop_id: str) -> bool:
        return prop_id in self.approved_props


@dataclass
class PerformerState:
    """Tracks current runtime state of the performer."""

    current_pose: str = "standing_neutral"
    current_action: str | None = None
    action_progress: float = 0.0
    active_props: list[str] = field(default_factory=list)
    wardrobe_state: dict[str, str] = field(default_factory=dict)
    camera_preset: str = "cam_wide"
    energy_level: float = 0.3
    action_queue: list[dict] = field(default_factory=list)
    last_permission_block: str | None = None

    def to_report(self) -> dict:
        return {
            "type": "performer.state_report",
            "current_pose": self.current_pose,
            "current_action": self.current_action,
            "action_progress": self.action_progress,
            "active_props": list(self.active_props),
            "wardrobe_state": dict(self.wardrobe_state),
            "camera_preset": self.camera_preset,
            "energy_level": self.energy_level,
            "queue_depth": len(self.action_queue),
            "last_permission_block": self.last_permission_block,
        }


class UnrealBridge:
    """Sends commands to Unreal Engine 5 via Remote Control WebSocket."""

    def __init__(self, host: str = "localhost", port: int = 8765, dry_run: bool = False):
        self.uri = f"ws://{host}:{port}"
        self.dry_run = dry_run
        self.ws = None
        self.sent_commands: list[dict] = []

    async def connect(self):
        if self.dry_run:
            log.info("Dry-run Unreal bridge active; commands will be recorded only")
            return
        self.ws = await websockets.connect(self.uri)
        log.info("Connected to Unreal Engine at %s", self.uri)

    async def close(self):
        if self.ws is not None:
            await self.ws.close()

    async def send(self, command: dict):
        self.sent_commands.append(command)
        if self.dry_run:
            log.info("DRY-RUN Unreal command: %s", command.get("functionName"))
            return
        if self.ws is None:
            log.warning("Unreal bridge not connected, dropping command: %s", command.get("functionName"))
            return
        await self.ws.send(json.dumps(command))

    async def set_pose(self, pose: str, blend: float):
        await self.send({
            "objectPath": "/Game/Performer/AnimBP.AnimBP",
            "functionName": "SetTargetPose",
            "parameters": {"PoseName": pose, "BlendTime": blend},
        })

    async def play_action(self, action_id: str, intensity: float, loop: bool):
        await self.send({
            "objectPath": "/Game/Performer/AnimBP.AnimBP",
            "functionName": "PlayActionClip",
            "parameters": {"ClipName": action_id, "Intensity": intensity, "Loop": loop},
        })

    async def set_expression(self, expression: str, intensity: float, blend: float):
        await self.send({
            "objectPath": "/Game/Performer/FaceRig.FaceRig",
            "functionName": "SetExpression",
            "parameters": {"Expression": expression, "Intensity": intensity, "BlendTime": blend},
        })

    async def attach_prop(self, prop_id: str, socket: str):
        await self.send({
            "objectPath": "/Game/Performer/PropManager.PropManager",
            "functionName": "AttachProp",
            "parameters": {"PropId": prop_id, "Socket": socket},
        })

    async def detach_prop(self, prop_id: str):
        await self.send({
            "objectPath": "/Game/Performer/PropManager.PropManager",
            "functionName": "DetachProp",
            "parameters": {"PropId": prop_id},
        })

    async def activate_prop(self, prop_id: str):
        await self.send({
            "objectPath": "/Game/Performer/PropManager.PropManager",
            "functionName": "ActivateProp",
            "parameters": {"PropId": prop_id},
        })

    async def deactivate_prop(self, prop_id: str):
        await self.send({
            "objectPath": "/Game/Performer/PropManager.PropManager",
            "functionName": "DeactivateProp",
            "parameters": {"PropId": prop_id},
        })

    async def set_camera(self, preset: str, transition: float):
        await self.send({
            "objectPath": "/Game/CameraDirector.CameraDirector",
            "functionName": "SetPreset",
            "parameters": {"Preset": preset, "TransitionTime": transition},
        })

    async def set_wardrobe(self, garment_id: str, state: str):
        await self.send({
            "objectPath": "/Game/Performer/WardrobeManager.WardrobeManager",
            "functionName": "SetGarmentState",
            "parameters": {"GarmentId": garment_id, "State": state},
        })

    async def set_look_at(self, target: str, intensity: float):
        await self.send({
            "objectPath": "/Game/Performer/FaceRig.FaceRig",
            "functionName": "SetLookAt",
            "parameters": {"Target": target, "Intensity": intensity},
        })

    async def set_idle(self, breathing: float, sway: float, energy: float):
        await self.send({
            "objectPath": "/Game/Performer/AnimBP.AnimBP",
            "functionName": "SetIdleBehavior",
            "parameters": {"BreathingRate": breathing, "SwayAmount": sway, "Energy": energy},
        })


class CommandHandler:
    """Processes inbound MUSE commands, enforces permissions, dispatches to UE5."""

    def __init__(self, profile: PerformerProfile, state: PerformerState, ue: UnrealBridge):
        self.profile = profile
        self.state = state
        self.ue = ue

    async def handle(self, msg: dict) -> dict | None:
        msg_type = msg.get("type", "")
        handler = {
            "performer.pose": self._handle_pose,
            "performer.action": self._handle_action,
            "performer.expression": self._handle_expression,
            "performer.prop": self._handle_prop,
            "performer.camera": self._handle_camera,
            "performer.wardrobe": self._handle_wardrobe,
            "performer.look_at": self._handle_look_at,
            "performer.idle_behavior": self._handle_idle,
            "performer.voice_sync": self._handle_voice_sync,
        }.get(msg_type)

        if handler is None:
            log.warning("Unknown message type: %s", msg_type)
            return {"type": "performer.error", "reason": f"Unknown message type: {msg_type}"}

        return await handler(msg)

    def _permission_denied(self, msg: dict, reason: str, required_permission: str) -> dict:
        self.state.last_permission_block = required_permission
        return {
            "type": "performer.permission_denied",
            "original_command": msg,
            "reason": reason,
            "required_permission": required_permission,
        }

    def _check_permission(self, msg: dict) -> dict | None:
        permission = msg.get("requires_permission")
        if permission and not self.profile.permits(permission):
            return self._permission_denied(
                msg,
                f"Permission '{permission}' not in performer profile",
                permission,
            )
        return None

    async def _handle_pose(self, msg: dict) -> dict | None:
        pose = str(msg["pose"])
        await self.ue.set_pose(pose, float(msg.get("blend_seconds", 2.0)))
        self.state.current_pose = pose
        return None

    async def _handle_action(self, msg: dict) -> dict | None:
        denied = self._check_permission(msg)
        if denied:
            return denied
        action_id = str(msg["action_id"])
        if not self.profile.action_allowed(action_id):
            return self._permission_denied(
                msg,
                f"Action '{action_id}' is blocked for this performer",
                "action_approval",
            )

        requested_intensity = float(msg.get("intensity", 0.5))
        intensity = max(0.0, min(requested_intensity, self.profile.max_intensity))
        await self.ue.play_action(action_id, intensity, bool(msg.get("loop", False)))
        self.state.current_action = action_id
        self.state.action_progress = 0.0
        return None

    async def _handle_expression(self, msg: dict) -> dict | None:
        await self.ue.set_expression(
            str(msg["expression"]),
            max(0.0, min(1.0, float(msg.get("intensity", 0.7)))),
            float(msg.get("blend_seconds", 0.3)),
        )
        return None

    async def _handle_prop(self, msg: dict) -> dict | None:
        denied = self._check_permission(msg)
        if denied:
            return denied

        prop_id = str(msg["prop_id"])
        if not self.profile.prop_allowed(prop_id):
            return self._permission_denied(
                msg,
                f"Prop '{prop_id}' not approved for this performer",
                "prop_approved",
            )

        action = msg["action"]
        if action == "attach":
            await self.ue.attach_prop(prop_id, str(msg.get("socket", "right_hand")))
            if prop_id not in self.state.active_props:
                self.state.active_props.append(prop_id)
        elif action == "detach":
            await self.ue.detach_prop(prop_id)
            self.state.active_props = [active for active in self.state.active_props if active != prop_id]
        elif action == "activate":
            await self.ue.activate_prop(prop_id)
        elif action == "deactivate":
            await self.ue.deactivate_prop(prop_id)
        else:
            return {"type": "performer.error", "reason": f"Unknown prop action: {action}"}
        return None

    async def _handle_camera(self, msg: dict) -> dict | None:
        preset = str(msg["preset"])
        await self.ue.set_camera(preset, float(msg.get("transition_seconds", 1.0)))
        self.state.camera_preset = preset
        return None

    async def _handle_wardrobe(self, msg: dict) -> dict | None:
        denied = self._check_permission(msg)
        if denied:
            return denied
        garment_id = str(msg["garment_id"])
        state = str(msg["state"])
        await self.ue.set_wardrobe(garment_id, state)
        self.state.wardrobe_state[garment_id] = state
        return None

    async def _handle_look_at(self, msg: dict) -> dict | None:
        await self.ue.set_look_at(str(msg["target"]), max(0.0, min(1.0, float(msg.get("intensity", 0.8)))))
        return None

    async def _handle_idle(self, msg: dict) -> dict | None:
        energy = max(0.0, min(1.0, float(msg.get("energy_level", 0.3))))
        await self.ue.set_idle(
            float(msg.get("breathing_rate", 1.0)),
            float(msg.get("sway_amount", 0.2)),
            energy,
        )
        self.state.energy_level = energy
        return None

    async def _handle_voice_sync(self, msg: dict) -> dict | None:
        await self.ue.send({
            "objectPath": "/Game/Performer/FaceRig.FaceRig",
            "functionName": "ProcessVisemes",
            "parameters": {
                "AudioURL": msg.get("audio_url", ""),
                "Visemes": msg.get("viseme_data", []),
                "BodyEnergy": max(0.0, min(1.0, float(msg.get("body_energy", 0.3)))),
            },
        })
        return None


async def muse_handler(ws, handler: CommandHandler, state: PerformerState):
    """Handle a single MUSE connection."""
    log.info("MUSE orchestrator connected")
    try:
        await ws.send(json.dumps(state.to_report()))

        async for raw in ws:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send(json.dumps({"type": "performer.error", "reason": "Invalid JSON"}))
                continue

            result = await handler.handle(msg)
            if result:
                await ws.send(json.dumps(result))
            await ws.send(json.dumps(state.to_report()))

    except websockets.ConnectionClosed:
        log.info("MUSE orchestrator disconnected")


def load_profile(profile_path: str | os.PathLike) -> PerformerProfile:
    path = Path(profile_path)
    with path.open("r", encoding="utf-8") as profile_file:
        return PerformerProfile.from_dict(json.load(profile_file))


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def build_arg_parser() -> argparse.ArgumentParser:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Run the VYBE Performer Runtime")
    parser.add_argument("--profile", default=os.getenv("VYBE_PERFORMER_PROFILE", str(root / "performers" / "luna.json")))
    parser.add_argument("--host", default=os.getenv("VYBE_RUNTIME_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.getenv("VYBE_RUNTIME_PORT", "9000")))
    parser.add_argument("--unreal-host", default=os.getenv("VYBE_UNREAL_HOST", "localhost"))
    parser.add_argument("--unreal-port", type=int, default=int(os.getenv("VYBE_UNREAL_PORT", "8765")))
    parser.add_argument("--dry-run", action="store_true", default=env_bool("VYBE_UNREAL_DRY_RUN", False))
    parser.add_argument("--retry-seconds", type=float, default=float(os.getenv("VYBE_UNREAL_RETRY_SECONDS", "3")))
    return parser


async def main(argv: list[str] | None = None):
    args = build_arg_parser().parse_args(argv)
    profile = load_profile(args.profile)
    state = PerformerState()
    ue = UnrealBridge(host=args.unreal_host, port=args.unreal_port, dry_run=args.dry_run)

    while True:
        try:
            await ue.connect()
            break
        except Exception as exc:
            log.warning("Waiting for Unreal Engine Remote Control at %s:%s (%s)", args.unreal_host, args.unreal_port, exc)
            await asyncio.sleep(args.retry_seconds)

    handler = CommandHandler(profile, state, ue)

    log.info(
        "Performer Runtime listening on ws://%s:%s for %s",
        args.host,
        args.port,
        profile.performer_id,
    )
    async with websockets.serve(lambda ws: muse_handler(ws, handler, state), args.host, args.port):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
