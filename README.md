# VYBE — The Platform Where You Are Known

## Project Structure
```
vybe-project/
├── frontend/          # React + Vite (run: cd frontend && npm install && npm run dev)
├── backend/           # Node.js + Express + PostgreSQL (Codex builds this)
│   ├── schema.sql     # Complete database schema
│   └── package.json   # Backend dependencies
└── docs/              # Strategy, architecture, and task breakdown
    ├── BACKEND_SPEC.md          # Full API spec for Codex
    ├── LINEAR_TASKS.md          # Every task organized by epic
    ├── VYBE_Moonshot_Vision.md  # The 5 things nobody has built
    └── VYBE_Platform_Analysis.md # 58-feature cross-platform comparison
```

## Quick Start (Frontend)
```bash
cd frontend
npm install
npm run dev
# → localhost:5173
```

## For Codex (Backend)
Read `docs/BACKEND_SPEC.md` for the full API specification.
Run `backend/schema.sql` against PostgreSQL to create all tables.

## Business Model
- 80/20 revenue split (performer keeps 80%)
- ONE currency: Sparks
- THREE access tiers: Free live rooms, Booked sessions ($25-$80), VIP ($150-$500)
- Earned loyalty (Bronze→Diamond by lifetime spend)
- Performer-controlled subscription pricing ($4.99-$49.99/mo)
- Request Feature = performer-priced custom experiences
- 11 game modes (always free, never gated)
