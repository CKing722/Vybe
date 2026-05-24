# VYBE Agent Operating Model

## Purpose

VYBE needs autonomous buildouts without agents colliding. This model defines who owns what, how work enters the system, and what "done" means.

## Hands-Off Operating Mode

Damon should not need to babysit implementation. The agent team should continue from the highest-priority unblocked work until VYBE meets the expectations captured in the repo and Linear.

Escalate to Damon only for:

- spending money or upgrading a paid service
- secrets/API keys/account credentials
- legal/compliance business decisions
- production service restarts or destructive infrastructure actions
- ambiguous brand/product decisions that cannot be resolved from the VYBE docs
- approval to accept a material scope reduction

Do not escalate for normal engineering judgment, research, local mocks, open-source choices, code structure, test creation, refactors inside assigned scope, or documentation updates.

## No-Spend Build Rule

The default answer to cost is: build locally, self-host, use open-source, or mock the paid integration until Damon approves spend.

Allowed without Damon approval:

- local development servers
- open-source packages
- local PostgreSQL/Redis-compatible development
- free documentation research
- self-hostable tools
- generated internal assets created in-repo
- mock payment/age-verification/live-video adapters

Not allowed without Damon approval:

- paid GitHub/Linear upgrades
- paid video infrastructure
- paid AI API usage beyond already-approved local/session tooling
- paid asset marketplaces
- paid payment/age-verification setup
- paid hosting, storage, CDN, or monitoring services

## Linear Project Separation

VYBE lives in the existing GhostNexus Linear team so final issue IDs use the normal `GHO-*` sequence, but VYBE must remain clearly separated from GhostOps, Ghost Nexus Prompt Library, and other non-VYBE work.

- Linear team: `GhostNexus`
- Canonical Linear project: `VYBE Platform`
- Required future issue labels: `VYBE` and `Project: VYBE`
- Required future workstream label: one child under `VYBE Workstream`
- Final Linear issue IDs are assigned by the GhostNexus team as `GHO-*`.
- If issue creation is blocked, use the `GhostNexus VYBE Task Ledger` project document with provisional `VYBE-GHO-###` IDs.
- If Linear issue creation is blocked, keep tasks in VYBE project documents and local repo commits until issue capacity is available.
- VYBE docs in Linear should stay attached to the `VYBE Platform` project.

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
- open-source 3D animation and web rendering research
- no-cost alternatives for paid infrastructure dependencies

### ChatGPT

ChatGPT owns review and synthesis support. It should not edit repo files by default. It should produce critique, copy, prompts, acceptance gaps, and pass/fail recommendations that the owning agent implements.

Good ChatGPT tasks:

- luxury product/design critique
- 2026 web interaction and animation review
- 3D/WebGPU/WebGL architecture critique
- gift spectacle expectation checks
- marketing copy and UX microcopy
- prompt packs for AI question generation and agent workflows
- red-team review of whether a build meets Damon's stated expectations

Use the Linear label `Review: ChatGPT` when this lane is required. If no separate ChatGPT connector or UI is available during an autonomous run, Codex may perform a ChatGPT-style review in the current OpenAI session and record it in artifacts.

## Unified Agent Loop

Each autonomous pass should:

1. Read `AGENTS.md`, this document, and the active Linear project docs.
2. Identify the highest-priority unblocked task.
3. Respect ownership boundaries.
4. If the task is backend/infra, Codex implements or prepares the branch.
5. If the task is frontend/design, Claude owns the patch; Codex can prepare contracts/docs without editing Claude-owned files.
6. If the task is research/QA, Hermes owns the report/checklist.
7. If the task has `Review: ChatGPT`, run a ChatGPT-style review before completion and record findings.
8. Run validation.
9. Record artifacts and blockers.
10. Continue to the next unblocked task.

The loop stops only for Damon-gated blockers, unavailable required access, or project completion.

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

Project Boundary:
GhostNexus team / VYBE Platform / VYBE / Project: VYBE

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

## 3D And Gift Spectacle Research Standard

VYBE should not settle for basic particle effects. Every major visual architecture decision should be informed by current research into:

- WebGPU and WebGL browser support
- Three.js and Babylon.js renderer capabilities
- PixiJS or similar 2D GPU particle engines
- Blender-to-web asset pipelines
- glTF/GLB model delivery
- shader/material authoring
- mobile GPU budgets and fallbacks
- designer-authored JSON effect definitions
- future spatial/AR readiness

No paid asset or tool is required by default. If a premium-quality effect requires a tool we do not have, first design an internal open-source workflow using Blender, code-generated geometry, procedural materials, and reusable effect definitions.

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

### ChatGPT

Branch: `research/chatgpt-review-lane`

Scope:

- Linear docs
- `docs/AGENT_OPERATING_MODEL.md`
- `AGENTS.md`
- optional review prompt docs

Deliverables:

- `Review: ChatGPT` label
- ChatGPT review prompt pack in Linear
- product/design review lane
- 3D/gift architecture review lane
- copy and prompt support lane
