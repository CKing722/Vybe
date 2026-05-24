# VYBE Agent Operating Model

## Purpose

VYBE needs autonomous buildouts without agents colliding. This model defines who owns what, how work enters the system, and what "done" means.

## Agent Roles

### Claude

Claude owns the frontend product layer. That includes the luxury visual system, component architecture, gift animation runtime, Canvas/WebGL/Pixi/Three effects, micro-interactions, and visual QA.

Claude should start with the gift spectacle vertical slice and split the current single-file React prototype into maintainable modules.

### Codex

Codex owns backend and infrastructure. That includes Express, PostgreSQL, Redis, Socket.io, auth, API routes, WebSocket event contracts, migrations, CI, repo setup, deployment documentation, and security middleware.

Codex should start with:

- Express server skeleton
- Health check route
- Auth route scaffold
- Gift event WebSocket contract
- Platform banner event contract
- `POST /api/games/questions`
- Fixing the PostgreSQL `NOW()` partial index issue

### Hermes

Hermes owns research, QA, and bounded support tasks. Hermes should not edit the same implementation files as Claude or Codex during parallel work.

Good Hermes tasks:

- LiveKit vs Cloudflare Stream recommendation
- CCBill adult platform integration requirements
- Yoti age verification SDK flow
- 2257 operational checklist
- Playwright smoke-test checklist
- Accessibility and mobile QA notes
- PR review checklists

## Current Hermes/VPS Findings

Read-only inspection on May 24, 2026 found:

- VPS reachable via `claw@100.126.125.24` using `C:\Users\Damon\claw_auto`.
- A separate Linux user exists: `hermes`.
- Hermes Agent is installed under `/home/hermes/.hermes/hermes-agent`.
- Hermes reports `Hermes Agent v0.14.0 (2026.5.16)` via:
  - `sudo -n -u hermes python3 /home/hermes/.hermes/hermes-agent/hermes_cli/main.py --version`
- Hermes gateway state says Telegram is connected.
- The `hermes` command is not currently on PATH for the checked non-interactive shell.
- OpenClaw runtime exists under `/home/claw/.openclaw`, but `openclaw` is not on PATH and `openclaw-gateway` reported inactive.
- Do not restart OpenClaw or Hermes services without explicit approval.

Recommended Hermes invocation pattern for read-only diagnostics:

```bash
sudo -n -u hermes python3 /home/hermes/.hermes/hermes-agent/hermes_cli/main.py status
sudo -n -u hermes python3 /home/hermes/.hermes/hermes-agent/hermes_cli/main.py doctor
```

## Linear Issue Template

```markdown
Goal:

Owner:

Scope:

Acceptance Criteria:

Validation:

Artifacts:

Blockers:
```

## Branch And PR Rules

- `main` is protected.
- Use one branch per issue.
- Keep branch scope aligned with owner.
- Do not mix frontend spectacle work with backend infrastructure work in one PR.
- PRs must include validation output.

## Initial Autonomous Queue

### Claude

Branch: `frontend/gift-spectacle-runtime`

Scope:

- `frontend/src/**`
- optional frontend-only docs

Deliverables:

- componentized live room shell
- gift animation runtime with JSON effect definitions
- Canvas/WebGL-ready overlay
- platform banner UI
- Spark Storm UI shell
- build passing

### Codex

Branch: `backend/gift-event-contract`

Scope:

- `backend/**`
- `docs/BACKEND_SPEC.md`
- GitHub Actions

Deliverables:

- Express app
- Socket.io server
- gift send event contract
- platform banner broadcast event
- Spark Storm event skeleton
- game questions backend endpoint
- schema index fix

### Hermes

Branch: `research/live-video-compliance`

Scope:

- `docs/research/**`
- `docs/compliance/**`

Deliverables:

- LiveKit vs Cloudflare Stream recommendation
- Yoti implementation notes
- CCBill implementation notes
- 2257 and moderation checklist
- risks and unanswered questions
