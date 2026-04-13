# 🥊 Argument Gym

> An AI sparring partner that challenges your arguments, names your logical fallacies, and scores your thinking.

Not a chatbot. Not another AI wrapper. A structured debate arena where an AI argues the opposite of everything you believe — and scores how well you defend it.

---

## What it does

1. **You pick a topic** — type anything or choose from starters
2. **You pick a stance** — For / Against / Undecided
3. **You pick difficulty** — Casual / Rigorous / Brutal
4. **You make your case** — AI extracts your 3 core claims
5. **You spar** — 3-5 rounds, AI attacks your weakest claim each time
6. **Side switch** (optional) — argue the opposite side, unlock the Perspective score
7. **Verdict** — clarity score out of 100, claim-by-claim breakdown, shareable card

---

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- An Anthropic API key — get one at https://console.anthropic.com

### 1. Clone and install

```bash
git clone <your-repo>
cd argument-gym
npm run install:all
```

### 2. Set up environment

```bash
cp .env.example backend/.env
# Open backend/.env and add your ANTHROPIC_API_KEY
```

### 3. Run (both frontend + backend together)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## Production Deployment

### Option A — Single server (recommended)

Builds the frontend and serves it from the Express backend. One port, one process.

```bash
# 1. Install all dependencies
npm run install:all

# 2. Set environment
cp .env.example backend/.env
# Edit backend/.env — set ANTHROPIC_API_KEY and NODE_ENV=production

# 3. Build frontend
npm run build
# This creates frontend/dist/

# 4. Copy frontend build to backend
cp -r frontend/dist backend/public

# 5. Start production server
cd backend
NODE_ENV=production npm start
# App runs at http://localhost:3001
```

### Option B — Docker

```bash
# Build image
docker build -t argument-gym .

# Run container
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_key_here \
  -e NODE_ENV=production \
  argument-gym

# App runs at http://localhost:3001
```

### Option C — Deploy to Railway / Render / Fly.io

```bash
# Set these environment variables in your platform dashboard:
ANTHROPIC_API_KEY=your_key_here
NODE_ENV=production
PORT=3001  # (usually auto-set by platform)

# Build command:
npm run install:all && npm run build && cp -r frontend/dist backend/public

# Start command:
cd backend && node server.js
```

### Option D — Vercel (frontend) + Railway (backend)

Frontend on Vercel:
```bash
cd frontend
# Set VITE_API_URL=https://your-backend.railway.app in Vercel env vars
npm run build
```

Backend on Railway:
```bash
cd backend
# Set ANTHROPIC_API_KEY, FRONTEND_URL=https://your-app.vercel.app
npm start
```

You'll need to update `frontend/src/lib/api.js` to use `VITE_API_URL` env var:
```js
const BASE = import.meta.env.VITE_API_URL || '/api';
```

---

## Project Structure

```
argument-gym/
├── package.json          # Root — scripts to run both services
├── .env.example          # Root env template
├── Dockerfile            # Docker production build
│
├── backend/
│   ├── server.js         # Express API + production static serving
│   ├── package.json
│   └── .env.example      # Copy to .env, add your API key
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx           # Phase orchestrator
        ├── main.jsx
        ├── index.css         # Global styles
        ├── hooks/
        │   └── useGym.js     # All game state and logic
        ├── lib/
        │   └── api.js        # API calls to backend
        └── components/
            ├── Landing.jsx         # Topic picker screen
            ├── Statement.jsx       # Opening argument screen
            ├── ClaimsConfirm.jsx   # Claim extraction review
            ├── Sparring.jsx        # Main debate arena
            ├── SideSwitchOffer.jsx # Side switch prompt
            ├── Verdict.jsx         # Score breakdown
            └── Loader.jsx          # Loading states
```

---

## Scoring System

| Axis | What it measures | Scale |
|------|-----------------|-------|
| Logic | Soundness of reasoning structure | 0–100 |
| Evidence | Use of facts, data, examples | 0–100 |
| Originality | Fresh thinking vs. clichés | 0–100 |
| Perspective | Only unlocked by side-switching | 0–100 |
| **Clarity Score** | **Weighted average of all axes** | **0–100** |

---

## Difficulty Modes

| Mode | AI Behavior |
|------|------------|
| Casual | Acknowledges good points, conversational |
| Rigorous | Demands evidence, names fallacies, no quarter |
| Brutal | Full Socratic — questions every premise, exposes assumptions |

---

## API Endpoints

```
POST /api/extract-claims   — Extract 3 core claims from opening statement
POST /api/argue            — Get AI counter-argument for a round
POST /api/verdict          — Get full debate verdict and scores
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `PORT` | No | 3001 | Backend port |
| `NODE_ENV` | No | development | Set to `production` to serve frontend |
| `FRONTEND_URL` | No | http://localhost:5173 | CORS origin in dev mode |

---

## Built with

- **Frontend**: React + Vite, CSS Modules
- **Backend**: Express.js, Node.js ESM
- **AI**: Anthropic Claude Sonnet (`claude-sonnet-4-5`)
- **Fonts**: Bebas Neue (display), DM Sans (body), DM Mono (labels)
- **Deploy**: Docker / Railway / Render / Fly.io ready

---

## The Philosophy

Most AI tools do things *for* you. Argument Gym does something *to* you — it makes you defend your thinking. The AI never agrees just to be nice. It attacks your weakest points. It names your logical fallacies. The only way to win is to actually think better.

That's the product.
