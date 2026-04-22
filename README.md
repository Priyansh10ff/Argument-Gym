<div align="center">
  <h1>🥊 ARGUMENT GYM</h1>
  <p><strong>AI-powered debate sparring with adaptive opponents, ELO ratings, and specialised training modes.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/license-MIT-red.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js 18+" />
    <img src="https://img.shields.io/badge/made%20with-React%2018-blue.svg" alt="React 18" />
    <img src="https://img.shields.io/badge/self--hostable-yes-green.svg" alt="Self-hostable" />
  </p>
</div>

---

Argument Gym is a self-hostable, open source debate training application. You pick a topic, take a stance, and an AI argues the opposite — relentlessly, by design. It tracks your weaknesses across sessions and gets harder to beat the better you get.

**Bring your own API key. Your data stays on your machine.**

---

## Features

- **Health Bar System** — Your 3 core claims each have HP. The AI chips away at them every round. All three collapse → instant verdict.
- **Adaptive Opponent** — Builds a weakness fingerprint across every debate. Targets your weakest dimension, recalls your repeated fallacies, and deploys your known objection failures.
- **ELO Rating** — Chess-style rating system against AI difficulty tiers. Global and daily leaderboards.
- **Standard Gym** 🥊 — Classic adversarial sparring. The AI always argues the opposite.
- **Court Gym** ⚖️ — Dual-role simulation: opposing counsel cross-examines you *and* a judge rules on every exchange.
- **Sales Gym** 💼 — Four distinct buyer personas (Skeptical CFO, Enthusiastic VP, Technical Buyer, Procurement). Objection memory. Paste your real pitch for context.
- **Human vs Human** 👥 — Real-time debates between two players. AI monitors every exchange and delivers a final verdict.
- **Side-switch** — After round 3, argue the opposite side for a Perspective score bonus.
- **Rate limiting** — Built-in IP-based throttling on all LLM endpoints.
- **Input sanitisation** — Strips delimiter injection attempts before they reach the LLM.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, CSS Modules |
| Backend | Node.js 20, Express 4, ES Modules |
| Real-time | Socket.IO 4 |
| Database | sql.js (SQLite in pure JS — no native compilation) |
| LLM | OpenAI-compatible SDK → any provider via `PRIMARY_LLM_BASE_URL` |

---

## Prerequisites

- **Node.js 18+** — check with `node --version`
- **An API key** for an OpenAI-compatible LLM provider
  - Free tier (used by default): [openrouter.ai/keys](https://openrouter.ai/keys)
  - Any provider works — OpenAI, Groq, Ollama, etc.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/yourusername/argument-gym
cd argument-gym

# 2. Install all dependencies (root + backend + frontend)
npm run install:all

# 3. Configure
cp .env.example backend/.env
```

Open `backend/.env` and set your API key:

```env
PRIMARY_LLM_API_KEY=your_key_here
```

```bash
# 4. Run
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend + Socket.IO | http://localhost:3001 |

The Vite dev server proxies `/api` and `/socket.io` to the backend automatically. No additional configuration needed.

---

## Configuration

All configuration lives in `backend/.env`. Copy `.env.example` to get started.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRIMARY_LLM_API_KEY` | **Yes** | — | API key for your LLM provider |
| `PRIMARY_LLM_BASE_URL` | No | `https://openrouter.ai/api/v1` | Base URL for any OpenAI-compatible API |
| `PRIMARY_LLM_MODEL` | No | `qwen/qwen3-plus:free` | Model identifier sent to the provider |
| `PORT` | No | `3001` | Port the Express server listens on |
| `NODE_ENV` | No | `development` | Set to `production` to enable static file serving and open CORS |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin — ignored when `NODE_ENV=production` |

### Switching LLM providers

Change two lines in `backend/.env`:

```env
# OpenAI
PRIMARY_LLM_BASE_URL=https://api.openai.com/v1
PRIMARY_LLM_MODEL=gpt-4o-mini

# Groq (fast free tier)
PRIMARY_LLM_BASE_URL=https://api.groq.com/openai/v1
PRIMARY_LLM_MODEL=llama-3.3-70b-versatile

# Local Ollama
PRIMARY_LLM_BASE_URL=http://localhost:11434/v1
PRIMARY_LLM_MODEL=llama3.2
PRIMARY_LLM_API_KEY=ollama
```

> **Model note:** The health bar and HvH features rely on the model returning structured delimiter tokens (`|||CLAIM_HITS|||`, `|||HVH_SCORES|||`). Larger models (gpt-4o-mini, llama-3.3-70b) are significantly more consistent than small free models. If health bars never deplete, switch to a stronger model.

---

## Production Deployment

In production, the backend serves the built frontend as static files. There is no separate frontend server.

```bash
# 1. Build the frontend
npm run build

# 2. Copy the build into the backend (macOS/Linux)
rm -rf backend/public
cp -r frontend/dist backend/public

# PowerShell
Remove-Item -Recurse -Force backend/public -ErrorAction SilentlyContinue
Copy-Item -Recurse frontend/dist backend/public

# 3. Set environment variables on your host (or create backend/.env)
#    NODE_ENV=production is required
#    FRONTEND_URL is not needed in production

# 4. Start
cd backend
NODE_ENV=production npm start
```

The app runs at `http://localhost:3001` (or your configured `PORT`).

The SQLite database is created automatically at `backend/data/argument-gym.sqlite` on first run.

---

## Docker

```bash
# Build
docker build -t argument-gym .

# Run
docker run -p 3001:3001 \
  -e PRIMARY_LLM_API_KEY=your_key_here \
  -e PRIMARY_LLM_BASE_URL=https://openrouter.ai/api/v1 \
  -e PRIMARY_LLM_MODEL=qwen/qwen3-plus:free \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  argument-gym
```

Mount `-v $(pwd)/data:/app/data` to persist the SQLite database across container restarts. Without this, ELO and leaderboard data resets on every restart.

---

## Available Scripts

Run from the repo root:

| Script | Description |
|---|---|
| `npm run install:all` | Install root, backend, and frontend dependencies |
| `npm run dev` | Start backend (watch mode) and frontend (Vite) concurrently |
| `npm run build` | Build frontend into `frontend/dist` |
| `npm run start` | Start backend + Vite preview together |
| `npm run start:backend` | Start backend only |
| `npm run start:frontend` | Start frontend Vite dev server only |

---

## API Reference

### Single-player endpoints

#### `POST /api/extract-claims`
Parses an opening statement into 3 structured claims.

```json
// Request
{
  "statement": "string",
  "topic": "string",
  "stance": "for | against",
  "difficulty": "casual | rigorous | brutal",
  "mode": "standard | courtroom | sales",
  "scenario": "string (optional — injected as context)",
  "persona": "skeptical_cfo | enthusiastic_vp | technical_buyer | procurement",
  "userId": "string (optional — for adaptive AI)"
}

// Response
{
  "claims": ["claim 1", "claim 2", "claim 3"],
  "summary": "one sentence summary"
}
```

#### `POST /api/argue`
Returns the AI counter-argument, round scores, claim hits, and (for Court Gym) a judge ruling.

```json
// Request — same fields as extract-claims, plus:
{ "messages": [{ "role": "user | assistant", "content": "string" }],
  "claims": ["string"] }

// Response
{
  "argument": "string",
  "scores": { "logic": 0-10, "evidence": 0-10, "originality": 0-10, "roundFeedback": "string" },
  "claimHits": [false, true, false],
  "judgeRuling": { "ruling": "sustained | overruled | noted", "comment": "string" }
}
```

`judgeRuling` is only present when `mode === "courtroom"`.

#### `POST /api/verdict`
Generates the final verdict and updates the user's weakness profile.

```json
// Request — same as argue, plus: "sideSwitch": boolean

// Response
{
  "claimResults": [{ "claim": "string", "survived": true, "note": "string" }],
  "overallFeedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "scores": { "logic": 0-100, "evidence": 0-100, "originality": 0-100, "perspective": 0-100 },
  "clarityScore": 0-100,
  "verdict": "Won | Lost | Draw"
}
```

### User & ELO endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/user/init` | Create or fetch user — body: `{ userId, name }` |
| `GET` | `/api/user/:id` | Get user stats, ELO history, and rank |
| `GET` | `/api/user/:id/weakness` | Get adaptive weakness profile |
| `POST` | `/api/elo/update` | Update ELO after verdict |
| `GET` | `/api/leaderboard` | Global and daily leaderboard |
| `GET` | `/api/sales/personas` | List available buyer persona IDs and names |

### Human vs Human — REST

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/hvh/create` | Create room — body: `{ userId, name, topic }` → `{ roomId }` |
| `GET` | `/api/hvh/room/:id` | Get room info |

### Human vs Human — Socket.IO

**Client → Server:**

| Event | Payload | Description |
|---|---|---|
| `hvh:join` | `{ roomId, userId, name }` | Join a room |
| `hvh:message` | `{ roomId, userId, text }` | Send a debate message |
| `hvh:verdict` | `{ roomId }` | Request final verdict |

**Server → Client:**

| Event | Description |
|---|---|
| `hvh:joined` | Joined successfully — `{ topic, status, players }` |
| `hvh:start` | Both players present, debate begins — `{ topic, players }` |
| `hvh:message` | Broadcast message — `{ playerName, playerIndex, text, ts }` |
| `hvh:ai_analysis` | Live AI scores after each exchange — `{ round, player1, player2, roundWinner, momentum, keyInsight }` |
| `hvh:final_verdict` | Final AI verdict — `{ verdict, players }` |
| `hvh:player_left` | Opponent disconnected — `{ userId }` |
| `hvh:error` | Error — `{ message }` |

---

## How the Adaptive AI Works

Argument Gym builds a **weakness fingerprint** on every user (identified by an anonymous UUID stored in the browser). After each completed debate, it records:

- Average scores across logic, evidence, and originality
- Recurring weaknesses from the verdict's analysis
- Logical fallacies the AI flagged (hasty generalisation, appeal to authority, straw man, etc.)
- In Sales Gym: specific objections the user failed to counter

On the next debate, this profile is injected into the system prompt. The AI is instructed to target the user's weakest dimension from round one, call out their repeated fallacies by name, and in Sales Gym, deploy the objections they historically fail on.

The fingerprint builds over time — after 2+ debates, the opponent becomes meaningfully harder for that specific user.

---

## Project Structure

```
argument-gym/
├── backend/
│   ├── server.js          # Express + Socket.IO — all API routes, rate limiting, sanitisation
│   ├── db.js              # sql.js SQLite — users, ELO, weakness profiles, debate history
│   ├── prompts.js         # All system prompts — modes, personas, adaptive context builder
│   └── data/
│       └── argument-gym.sqlite   # Auto-created on first run (gitignored)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── MarketingPage.jsx  # Landing/marketing page (first visit)
│       │   ├── Landing.jsx        # Gym config — mode, topic, persona, scenario
│       │   ├── Statement.jsx      # Opening argument input
│       │   ├── ClaimsConfirm.jsx  # Review extracted claims before sparring
│       │   ├── Sparring.jsx       # Main debate arena with health bars
│       │   ├── HealthBar.jsx      # Claim HP component
│       │   ├── SideSwitchOffer.jsx
│       │   ├── Verdict.jsx        # Final verdict + ELO delta
│       │   ├── HvHLobby.jsx       # Create/join HvH room
│       │   └── HvHSparring.jsx    # Real-time HvH debate + AI monitor
│       ├── hooks/
│       │   └── useGym.js          # State machine for the entire single-player debate flow
│       └── lib/
│           ├── api.js             # Typed fetch wrappers for all API endpoints
│           └── identity.js        # Anonymous UUID generation and persistence
├── .env.example                   # Documented environment variable template
├── .gitignore
├── Dockerfile                     # Multi-stage build — frontend + backend in one image
├── CONTRIBUTING.md
├── LICENSE                        # MIT
└── package.json                   # Root scripts — install, dev, build, start
```

---

## Scoring

**Per-round scores** (0–10, from `/api/argue`, evaluating the user's argument):

| Mode | Score 1 | Score 2 | Score 3 |
|---|---|---|---|
| Standard | Logic | Evidence | Originality |
| Court Gym | Legal Reasoning | Precedent | Strategy |
| Sales Gym | Pitch Flow | Proof Points | Differentiation |

Round averages are converted to 0–100 for the live display.

**Final verdict scores** (0–100, from `/api/verdict`): logic, evidence, originality, perspective (side-switch only), clarityScore.

**ELO K-factors** (how much rating changes per debate):

| Difficulty | K-factor | Opponent ELO |
|---|---|---|
| Casual | 16 | 1400 |
| Rigorous | 24 | 1700 |
| Brutal | 32 | 2000 |

---

## Troubleshooting

**Health bars never deplete (`claimHits` always `[false, false, false]`)**
The model isn't returning `|||CLAIM_HITS|||` reliably. This is common with small free models. Switch to a larger model — `gpt-4o-mini` or `llama-3.3-70b-versatile` are significantly more consistent.

**`Model format error` on extract-claims or verdict**
Same cause. The model failed to return the expected delimiter tokens. Upgrade the model.

**`Failed to process your argument`**
`backend/.env` is missing, or `PRIMARY_LLM_API_KEY` is invalid or unpopulated. Confirm the file exists at `backend/.env` and the key is active.

**Leaderboard shows no entries**
The SQLite database at `backend/data/argument-gym.sqlite` is created on first run. Complete one full debate (through to the verdict screen) to write the first ELO entry.

**HvH — opponent can't connect**
Both players must connect to the same server instance. In development, both browsers must be on the same machine. HvH rooms are in-memory — a server restart clears all active rooms.

**CORS errors in custom deployments**
Ensure `NODE_ENV=production` is set. In production mode, CORS is open to all origins. In development mode, set `FRONTEND_URL` to your exact frontend origin.

**`Run npm run build first` in production**
The backend couldn't find `backend/public/index.html`. Run the build and copy steps in the [Production Deployment](#production-deployment) section.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

[MIT](./LICENSE) — fork it, modify it, ship it.
