# 🥊 Argument Gym

> **Train your mind. Defend your stance. Survive the verdict.**

AI debate sparring app that challenges your stance, highlights weak reasoning, and returns a scored verdict.

## 🎯 What It Does

1. Pick a topic and stance (`for` or `against`)
2. Pick difficulty (`casual`, `rigorous`, `brutal`)
3. Submit your opening statement
4. AI extracts 3 core claims from your argument
5. Debate up to 5 rounds against an adversarial AI
6. Optional side-switch after round 3+ to argue the opposite position
7. Receive a final verdict with score breakdown across logic, evidence, originality, and clarity

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js 20, Express 4 (ES modules) |
| LLM | OpenAI-compatible SDK → [OpenRouter](https://openrouter.ai) (default: `qwen/qwen3-plus:free`) |

The backend uses the `openai` npm package and connects to any OpenAI-compatible endpoint via `PRIMARY_LLM_BASE_URL`. It defaults to OpenRouter, but can point to OpenAI, Groq, or a local inference server by changing two environment variables.

## ✅ Prerequisites

- Node.js 18+
- An API key for an OpenAI-compatible provider (free tier available at [openrouter.ai](https://openrouter.ai/keys))

## ⚡ Quick Start (Development)

**1. Install all dependencies**

```bash
npm run install:all
```

**2. Create the backend env file**

macOS / Linux:
```bash
cp .env.example backend/.env
```

PowerShell:
```powershell
Copy-Item .env.example backend/.env
```

**3. Fill in your API key**

Edit `backend/.env`:

```env
PRIMARY_LLM_API_KEY=your_openrouter_api_key_here
PRIMARY_LLM_BASE_URL=https://openrouter.ai/api/v1
PRIMARY_LLM_MODEL=qwen/qwen3-plus:free
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**4. Start the dev servers**

```bash
npm run dev
```

- 🌐 Frontend: `http://localhost:5173`
- 🔌 Backend API: `http://localhost:3001`

The Vite dev server proxies all `/api/*` requests to the backend automatically.

## 📜 Available Scripts

Run from the repo root:

| Script | Description |
|---|---|
| `npm run install:all` | Installs root, backend, and frontend dependencies |
| `npm run dev` | Starts backend (watch mode) and frontend (Vite) concurrently |
| `npm run build` | Builds the frontend into `frontend/dist` |
| `npm run start` | Starts backend + Vite preview together |
| `npm run start:backend` | Starts backend only |
| `npm run start:frontend` | Starts frontend Vite dev server only |

## 📡 API Reference

Base URL in development: proxied from Vite `/api` → `http://localhost:3001`

### `POST /api/extract-claims`

Parses an opening statement into 3 structured claims.

**Body:**
```json
{
  "statement": "string",
  "topic": "string",
  "stance": "for | against",
  "difficulty": "casual | rigorous | brutal"
}
```

**Response:**
```json
{
  "claims": ["claim 1", "claim 2", "claim 3"],
  "summary": "one sentence summary"
}
```

---

### `POST /api/argue`

Returns the AI's counter-argument and per-round scores for the user's last message.

**Body:**
```json
{
  "messages": [{ "role": "user | assistant", "content": "string" }],
  "topic": "string",
  "stance": "for | against",
  "difficulty": "casual | rigorous | brutal",
  "claims": ["string"]
}
```

**Response:**
```json
{
  "argument": "string",
  "scores": {
    "logic": 0,
    "evidence": 0,
    "originality": 0,
    "roundFeedback": "string"
  }
}
```

---

### `POST /api/verdict`

Generates the final verdict after all rounds complete.

**Body:** Same as `/api/argue`, plus `"sideSwitch": boolean`

**Response:**
```json
{
  "claimResults": [{ "claim": "string", "survived": true, "note": "string" }],
  "overallFeedback": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "scores": {
    "logic": 0,
    "evidence": 0,
    "originality": 0,
    "perspective": 0
  },
  "clarityScore": 0,
  "verdict": "Won | Lost | Draw"
}
```

## 🚀 Production Deployment

In production, the backend serves the built frontend as static files from `backend/public`. There is no separate frontend server.

**1. Build the frontend**

```bash
npm run build
```

**2. Copy the build into the backend**

macOS / Linux:
```bash
rm -rf backend/public
cp -r frontend/dist backend/public
```

PowerShell:
```powershell
Remove-Item -Recurse -Force backend/public -ErrorAction SilentlyContinue
Copy-Item -Recurse frontend/dist backend/public
```

**3. Configure the backend env**

Create `backend/.env` (or set environment variables on your host):

```env
PRIMARY_LLM_API_KEY=your_openrouter_api_key_here
PRIMARY_LLM_BASE_URL=https://openrouter.ai/api/v1
PRIMARY_LLM_MODEL=qwen/qwen3-plus:free
PORT=3001
NODE_ENV=production
```

`FRONTEND_URL` is not required in production — CORS is set to `*` when `NODE_ENV=production`.

**4. Start the server**

```bash
cd backend
npm start
```

App is available at `http://localhost:3001` (or your configured `PORT`).

## 🐳 Docker

A multi-stage `Dockerfile` is included. The builder stage compiles the frontend; the production stage bundles it with the backend.

```bash
docker build -t argument-gym .

docker run -p 3001:3001 \
  -e PRIMARY_LLM_API_KEY=your_key_here \
  -e PRIMARY_LLM_BASE_URL=https://openrouter.ai/api/v1 \
  -e PRIMARY_LLM_MODEL=qwen/qwen3-plus:free \
  -e NODE_ENV=production \
  argument-gym
```

## 🔁 Using a Different LLM Provider

The backend accepts any OpenAI-compatible endpoint. Set `PRIMARY_LLM_BASE_URL` and `PRIMARY_LLM_MODEL` to switch providers without changing code.

| Provider | `PRIMARY_LLM_BASE_URL` | Example model |
|---|---|---|
| ⚡ OpenRouter (default) | `https://openrouter.ai/api/v1` | `qwen/qwen3-plus:free` |
| 🤖 OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| 🦙 Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| 🏠 Local (Ollama) | `http://localhost:11434/v1` | `llama3.2` |

## 🔐 Environment Variables

All variables are read by `backend/.env` (or system environment in production/Docker).

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRIMARY_LLM_API_KEY` | **Yes** | — | API key for your LLM provider |
| `PRIMARY_LLM_BASE_URL` | No | `https://openrouter.ai/api/v1` | Base URL for any OpenAI-compatible API |
| `PRIMARY_LLM_MODEL` | No | `qwen/qwen3-plus:free` | Model identifier passed to the provider |
| `PORT` | No | `3001` | Port the Express server listens on |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin (ignored in production) |
| `NODE_ENV` | No | `development` | Set to `production` to enable static file serving |

## 📁 Project Structure

```
argument-gym/
├── backend/
│   ├── server.js          # Express API + static file serving
│   ├── package.json
│   └── public/            # Built frontend (copied here for production)
├── frontend/
│   ├── src/
│   │   ├── components/    # React UI components (phases of the debate flow)
│   │   ├── hooks/
│   │   │   └── useGym.js  # Central state machine for the debate flow
│   │   └── lib/
│   │       └── api.js     # Typed fetch wrappers for all API endpoints
│   ├── vite.config.js
│   └── package.json
├── .env.example
├── Dockerfile
└── package.json           # Root scripts using concurrently
```

## 🏆 Scoring

**Per-round scores** (0–10, returned by `/api/argue`, evaluated on the user's argument):
- `logic` — soundness of reasoning
- `evidence` — quality and specificity of supporting evidence
- `originality` — novelty or creativity of the argument
- `roundFeedback` — one-sentence critique of the weakest point

The frontend converts running round averages to a 0–100 display scale.

**Final verdict scores** (0–100, returned by `/api/verdict`):
- `logic`, `evidence`, `originality`, `perspective` — overall debate performance
- `clarityScore` — how clearly the user communicated throughout

## 🩹 Troubleshooting

**`Model format error` or empty response**  
The model failed to return the expected `|||CLAIMS|||`, `|||SCORES|||`, or `|||VERDICT|||` delimiters. Some smaller or heavily filtered models are inconsistent — try switching to a more capable model via `PRIMARY_LLM_MODEL`.

**`Failed to process your argument`**  
`backend/.env` is missing or `PRIMARY_LLM_API_KEY` is not set / invalid. Confirm the file exists at `backend/.env` and the key is active for the provider at `PRIMARY_LLM_BASE_URL`.

**Frontend cannot reach backend**  
Ensure the backend is running on port `3001` and the Vite dev server is running (which handles the `/api` proxy). Verify with `curl http://localhost:3001/api/extract-claims`.

**CORS errors in custom deployments**  
In non-production mode, set `FRONTEND_URL` in `backend/.env` to your exact frontend origin (e.g. `https://app.yourdomain.com`). In production mode (`NODE_ENV=production`), CORS is open to all origins.

**`Run npm run build first` in production**  
The backend could not find `backend/public/index.html`. Run the build and copy steps in the [Production Deployment](#production-deployment) section.