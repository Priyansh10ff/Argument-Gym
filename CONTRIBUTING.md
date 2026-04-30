# Contributing to Argument Gym

Thanks for wanting to contribute. This is a focused document — read it once and you'll know everything you need.

## Quick start

```bash
git clone https://github.com/yourusername/argument-gym
cd argument-gym
npm run install:all
cp .env.example backend/.env
# Edit backend/.env — add your PRIMARY_LLM_API_KEY
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

## Project structure

```
argument-gym/
├── backend/
│   ├── server.js    # Express + Socket.IO — all API routes
│   ├── db.js        # SQLite (sql.js) — users, ELO, weakness profiles
│   └── prompts.js   # All LLM system prompts — modes, personas, adaptive logic
├── frontend/
│   └── src/
│       ├── components/   # React components — one file per screen/feature
│       ├── hooks/
│       │   └── useGym.js # Central state machine for the debate flow
│       └── lib/
│           ├── api.js      # Fetch wrappers for all endpoints
│           └── identity.js # Anonymous UUID persistence
└── .env.example
```

## What's in scope for contributions

**Good PRs:**
- Bug fixes with a clear reproduction case
- New LLM provider examples in the README or `.env.example`
- Accessibility improvements (keyboard nav, screen reader labels)
- Performance improvements (debouncing, memoisation)
- New starter topics
- Documentation corrections

**Requires discussion first (open an issue):**
- New training modes (Court Gym, Sales Gym were significant efforts — new modes need the same depth)
- Changes to the ELO formula or scoring system
- Database schema changes
- New dependencies

**Not in scope for this OSS version:**
- Payment/subscription features
- Authentication systems
- Analytics or telemetry
- Anything that requires a hosted service

## Code style

- **No formatter config is enforced** — match the style of the file you're editing
- ES modules throughout (`import`/`export`, no `require`)
- React functional components only — no class components
- CSS Modules for all component styles — no global classes, no inline styles
- Use the existing CSS variables (`--red`, `--gray`, `--font-mono`, etc.) — don't introduce new colour values

## Submitting a PR

1. Fork the repo and create a branch: `git checkout -b fix/your-fix-name`
2. Make your change
3. Run `npm run build` from the root and confirm it passes with zero errors
4. Open a PR with a clear title and a one-paragraph description of what changed and why

## Reporting bugs

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Your Node.js version (`node --version`)
- Your LLM provider and model (`PRIMARY_LLM_MODEL` value)
- Any error output from the terminal

## Questions

Open a GitHub Discussion — not an issue. Issues are for confirmed bugs and accepted feature requests.
