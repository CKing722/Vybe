# Claude Activation: VYBE Frontend Build

You are the frontend/design owner for VYBE.

## Start Now

Damon has approved active VYBE buildout. Do not wait for more setup unless a real blocker exists.

Claude Code CLI is approved through Damon's subscription. Do not use raw Anthropic API keys or browser/client AI provider calls for VYBE.

## Source Of Truth

Read these before editing:

- `AGENTS.md`
- `docs/AGENT_OPERATING_MODEL.md`
- `docs/BACKEND_API_CONTRACTS.md`
- Linear project: `VYBE Platform`
- Linear document: `GhostNexus VYBE Task Ledger`
- Linear document: `Team Activation Brief - Start Buildout Now - 2026-05-24`

## Your Active Assignment

Ledger item:

```text
VYBE-GHO-001: Frontend - Build Gift Spectacle Runtime
```

Branch:

```text
frontend/gift-spectacle-runtime
```

Scope:

- `frontend/src/**`
- frontend-only docs as needed

## Required Outcome

Build the first VYBE frontend differentiator: a luxury live-room gift spectacle runtime that scales from subtle low-tier gifts to full-screen cinematic high-tier gifts.

Acceptance criteria:

- Current single-file prototype is split into maintainable frontend modules.
- Gift runtime supports JSON effect definitions.
- Low-tier gifts remain subtle.
- High-tier gifts can dominate the live room with cinematic overlays.
- Platform-wide banner UI exists for 500+ spark gifts.
- Spark Storm UI shell exists.
- Frontend visual direction stays premium, restrained, and mobile-safe.
- Backend integration uses `docs/BACKEND_API_CONTRACTS.md`.

Validation:

```bash
cd frontend
npm run build
```

Also capture desktop and mobile visual evidence when browser tooling is available.

## Boundaries

- Do not edit `backend/**` unless a task explicitly assigns that scope.
- Do not create paid dependencies or paid assets.
- Do not call raw paid APIs or provider API-key endpoints.
- Do not mutate non-VYBE GhostOps/Ghost Nexus work.
- If a separate ChatGPT review is unavailable, request or perform a ChatGPT-style critique before marking visual/3D architecture complete.

If the result does not meet the VYBE bar, treat it as unfinished and keep improving.
