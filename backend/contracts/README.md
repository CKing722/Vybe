# VYBE Backend Contracts

This folder contains machine-readable contracts for frontend integration.

- `openapi.yaml`: HTTP API contract for the local demo backend (`http://localhost:4000`).

Notes:

- This project is **no-spend by default**. Game questions are generated locally; raw paid provider APIs are disabled unless explicitly enabled server-side.
- WebSocket (Socket.io) event payloads are documented in `docs/BACKEND_API_CONTRACTS.md`.
