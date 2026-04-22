# 🥊 Argument Gym v2

> **Train your mind. Defend your stance. Survive the verdict.**

AI debate sparring app with ELO rankings, claim health bars, multiple training modes, and real-time human vs human debates with AI monitoring.

---

## ✨ What's New in v2

| Feature | Description |
|---|---|
| ⚔️ **Health Bar System** | Each of your 3 claims has HP. AI chips away at them each round. All 3 collapse → instant verdict |
| 🏆 **ELO Rating + Leaderboard** | Chess-style ELO against AI difficulty tiers. Global and daily leaderboards |
| 🎭 **Simulation Modes** | Standard Gym 🥊, Court Gym ⚖️ (legal cross-examination), Sales Gym 💼 (pitch training) |
| 👥 **Human vs Human** | Real-time debates with a friend. AI monitors every exchange and delivers a final verdict |

---

## 🎯 How It Works (Single Player)

1. Pick a **mode** — Standard, Court Gym, or Sales Gym
2. Pick a **topic**, **stance**, and **difficulty**
3. Submit your opening statement → AI extracts 3 core claims with HP
4. Debate up to 5 rounds. AI attacks your claims and reduces their health each round
5. Side-switch offer after round 3 to argue the opposite side
6. Final verdict with scores, ELO delta, and claim-by-claim breakdown

## 👥 How It Works (Human vs Human)

1. Player 1 creates a room → gets an 8-character code
2. Player 2 joins with the code
3. Player 1 argues FOR, Player 2 argues AGAINST
4. AI monitors in a live sidebar — scoring every exchange as it happens
5. Either player requests the final verdict to end the debate

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js 20, Express 4 (ES modules) |
| Real-time | Socket.IO 4 |
| Database | sql.js (SQLite in pure JS — no native build needed) |
| LLM | OpenAI-compatible SDK → OpenRouter (default: `qwen/qwen3-plus:free`) |

---

## ✅ Prerequisites

- Node.js 18+
- An API key for an OpenAI-compatible LLM provider
  - Free tier: [openrouter.ai/keys](https://openrouter.ai/keys)

---

## ⚡ Quick Start (Development)

**1. Install all dependencies**

```bash
npm run install:all
```

**2. Create the backend env file**

```bash
# macOS / Linux
cp .env.example backend/.env

# PowerShell
Copy-Item .env.example backend/.env
```

**3. Fill in your API key** — edit `backend/.env`:

```env
PRIMARY_LLM_API_KEY=your_openrouter_api_key_here
PRIMARY_LLM_BASE_URL=https://openrouter.ai/api/v1
PRIMARY_LLM_MODEL=qwen/qwen3-plus:free
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**4. Run**

```bash
npm run dev
```

- 🌐 Frontend: `http://localhost:5173`
- 🔌 Backend + Socket.IO: `http://localhost:3001`

---

## 🚀 Production Deployment

```bash
# 1. Build frontend
npm run build

# 2. Copy build into backend (macOS/Linux)
rm -rf backend/public && cp -r frontend/dist backend/public

# PowerShell
Remove-Item -Recurse -Force backend/public -ErrorAction SilentlyContinue
Copy-Item -Recurse frontend/dist backend/public

# 3. Set env vars on your host (or create backend/.env)
PRIMARY_LLM_API_KEY=...
NODE_ENV=production
PORT=3001

# 4. Start
cd backend && npm start
```

App runs at `http://localhost:3001`. The database file `backend/data.sqlite` is created automatically on first run and persists ELO/leaderboard data.

---

## 🐳 Docker

```bash
docker build -t argument-gym .

docker run -p 3001:3001 \
  -e PRIMARY_LLM_API_KEY=your_key_here \
  -e PRIMARY_LLM_BASE_URL=https://openrouter.ai/api/v1 \
  -e PRIMARY_LLM_MODEL=qwen/qwen3-plus:free \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  argument-gym
```

> Mount a volume to `-v $(pwd)/data:/app` if you want the SQLite database to persist across container restarts.

---

## 🔁 Using a Different LLM Provider

| Provider | `PRIMARY_LLM_BASE_URL` | Example model |
|---|---|---|
| ⚡ OpenRouter (default) | `https://openrouter.ai/api/v1` | `qwen/qwen3-plus:free` |
| 🤖 OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| 🦙 Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| 🏠 Local (Ollama) | `http://localhost:11434/v1` | `llama3.2` |

> **Note:** Health bars and HvH monitoring require the model to reliably return structured delimiter tokens (`|||CLAIM_HITS|||`, `|||HVH_SCORES|||`). Larger models (gpt-4o-mini, llama-3.3-70b) are more consistent than small free models.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run install:all` | Installs root, backend, and frontend dependencies |
| `npm run dev` | Starts backend + frontend concurrently (dev mode) |
| `npm run build` | Builds frontend into `frontend/dist` |
| `npm run start` | Starts backend + Vite preview |
| `npm run start:backend` | Starts backend only |

---

## 📡 API Reference

### Single-Player

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/extract-claims` | Parse opening statement into 3 claims |
| `POST` | `/api/argue` | Get AI counter-argument + scores + claim hits |
| `POST` | `/api/verdict` | Final verdict after all rounds |

### ELO / Leaderboard

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/user/init` | Create or fetch user by UUID |
| `GET` | `/api/user/:id` | Get user stats + history |
| `POST` | `/api/elo/update` | Update ELO after a verdict |
| `GET` | `/api/leaderboard` | Global + daily leaderboard |

### Human vs Human (REST)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/hvh/create` | Create a room, get 8-char code |
| `GET` | `/api/hvh/room/:id` | Get room info (status, players, topic) |

### Human vs Human (Socket.IO events)

**Client → Server:**

| Event | Payload | Description |
|---|---|---|
| `hvh:join` | `{ roomId, userId, name }` | Join a room |
| `hvh:message` | `{ roomId, userId, text }` | Send a debate message |
| `hvh:verdict` | `{ roomId }` | Request final verdict |

**Server → Client:**

| Event | Payload | Description |
|---|---|---|
| `hvh:joined` | `{ topic, status, players }` | Joined successfully |
| `hvh:start` | `{ topic, players }` | Both players present — debate begins |
| `hvh:message` | `{ playerName, playerIndex, text, ts }` | Broadcast message |
| `hvh:ai_analysis` | `{ round, player1, player2, roundWinner, momentum, keyInsight }` | Live AI scores |
| `hvh:final_verdict` | `{ verdict, players }` | Final AI verdict |
| `hvh:player_left` | `{ userId }` | Opponent disconnected |
| `hvh:error` | `{ message }` | Error |

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRIMARY_LLM_API_KEY` | **Yes** | — | API key for your LLM provider |
| `PRIMARY_LLM_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenAI-compatible base URL |
| `PRIMARY_LLM_MODEL` | No | `qwen/qwen3-plus:free` | Model identifier |
| `PORT` | No | `3001` | Express server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS origin (dev only) |
| `NODE_ENV` | No | `development` | Set `production` to enable static serving |

---

## 📁 Project Structure

```
argument-gym/
├── backend/
│   ├── server.js        # Express + Socket.IO server
│   ├── db.js            # sql.js SQLite — users, ELO, daily scores
│   ├── prompts.js       # System prompts for all modes
│   ├── data.sqlite      # Auto-created on first run (gitignored)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx        # Mode select, ELO bar, leaderboard
│   │   │   ├── Sparring.jsx       # Debate arena with health bars
│   │   │   ├── HealthBar.jsx      # Claim HP component
│   │   │   ├── Verdict.jsx        # Final verdict + ELO delta
│   │   │   ├── HvHLobby.jsx       # Create / join HvH room
│   │   │   └── HvHSparring.jsx    # Real-time HvH debate + AI monitor
│   │   ├── hooks/
│   │   │   └── useGym.js          # State machine (single-player)
│   │   └── lib/
│   │       ├── api.js             # Fetch wrappers
│   │       └── identity.js        # Anonymous UUID persistence
│   ├── vite.config.js   # Proxies /api and /socket.io → backend
│   └── package.json
├── .env.example
├── Dockerfile
└── package.json
```

---

## 🏆 Scoring

**Per-round (0–10), returned by `/api/argue`:**
- `logic` / `evidence` / `originality` — labelled differently per mode
- `roundFeedback` — one-sentence critique
- `claimHits` — `[bool, bool, bool]` — which claims the AI successfully undermined

**Final verdict (0–100), returned by `/api/verdict`:**
- `logic`, `evidence`, `originality`, `perspective` (if side-switched), `clarityScore`
- `claimResults` — survived / collapsed per claim

**ELO K-factors by difficulty:**
- `casual` → K=16 (vs AI rated 1400)
- `rigorous` → K=24 (vs AI rated 1700)
- `brutal` → K=32 (vs AI rated 2000)

---

## 🩹 Troubleshooting

**Health bars always show full / `claimHits` always `[false,false,false]`**
The model isn't returning the `|||CLAIM_HITS|||` delimiter reliably. Switch to a larger model. Health bars still display but won't decrement.

**Leaderboard shows no entries**
`data.sqlite` may not be created yet — play one full debate to completion to trigger ELO write.

**HvH opponent can't connect**
Both players must use the same server. In dev, both browsers on the same machine. In production, share the deployed URL. The room code is only valid while the server is running (rooms are in-memory).

**`Model format error`**
The LLM didn't return expected delimiters. Try a more capable model via `PRIMARY_LLM_MODEL`.

**`Failed to process your argument`**
`backend/.env` is missing or `PRIMARY_LLM_API_KEY` is invalid.

**CORS errors in production**
Set `NODE_ENV=production` — CORS becomes `*` and the backend serves the built frontend.
