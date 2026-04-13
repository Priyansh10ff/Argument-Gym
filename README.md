# Argument Gym

AI debate sparring app that challenges your stance, highlights weak reasoning, and returns a scored verdict.

## What It Does

1. Pick a topic and stance (`for` or `against`)
2. Pick difficulty (`casual`, `rigorous`, `brutal`)
3. Submit your opening statement
4. AI extracts 3 core claims
5. Debate up to 5 rounds
6. Optional side-switch after round 3+
7. Receive final verdict and score breakdown

## Tech Stack

- Frontend: React + Vite
- Backend: Express + Anthropic SDK
- Runtime: Node.js (ES modules)

## Prerequisites

- Node.js 18+
- Anthropic API key

## Quick Start (Development)

From repo root:

```bash
npm run install:all
```

Create backend env file:

PowerShell:

```powershell
Copy-Item .env.example backend/.env
```

macOS/Linux:

```bash
cp .env.example backend/.env
```

Edit `backend/.env` and set:

```env
ANTHROPIC_API_KEY=your_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Run frontend + backend together:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Available Scripts

At repo root:

- `npm run install:all` - installs root, backend, frontend dependencies
- `npm run dev` - runs backend and frontend in watch/dev mode
- `npm run build` - builds frontend (`frontend/dist`)
- `npm run start` - starts backend and Vite preview together
- `npm run start:backend` - starts backend only
- `npm run start:frontend` - starts frontend dev server only

## API

Base URL in development: proxied from Vite `/api` to `http://localhost:3001`.

Endpoints:

- `POST /api/extract-claims`
- `POST /api/argue`
- `POST /api/verdict`

## Production

The backend serves static frontend files from `backend/public` when `NODE_ENV=production`.

Build and run:

```bash
npm run build
```

Copy built frontend into backend public folder:

PowerShell:

```powershell
Remove-Item -Recurse -Force backend/public -ErrorAction SilentlyContinue
Copy-Item -Recurse frontend/dist backend/public
```

macOS/Linux:

```bash
rm -rf backend/public
cp -r frontend/dist backend/public
```

Start backend:

```bash
cd backend
NODE_ENV=production npm start
```

App will be available at `http://localhost:3001` (or your `PORT`).

## Docker

A `Dockerfile` is included for containerized deployment.

Example:

```bash
docker build -t argument-gym .
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=your_key_here -e NODE_ENV=production argument-gym
```

## Project Structure

```text
argument-gym/
|- backend/
|  |- server.js
|  |- package.json
|- frontend/
|  |- src/
|  |  |- components/
|  |  |- hooks/useGym.js
|  |  |- lib/api.js
|  |- vite.config.js
|  |- package.json
|- .env.example
|- Dockerfile
|- package.json
```

## Environment Variables

- `ANTHROPIC_API_KEY` (required)
- `PORT` (optional, default `3001`)
- `FRONTEND_URL` (used for backend CORS in non-production)
- `NODE_ENV` (`production` enables static file serving)

## Scoring

Round-level model scores are returned for:

- logic (0-10)
- evidence (0-10)
- originality (0-10)

Frontend converts running round averages to 0-100 display values.

Final verdict includes 0-100 scores plus a clarity score.

## Troubleshooting

- `Failed to process your argument`: confirm `backend/.env` exists and `ANTHROPIC_API_KEY` is valid.
- Frontend cannot reach backend: ensure backend is running on `3001` and Vite proxy is active.
- CORS errors in custom deployments: set `FRONTEND_URL` to your frontend origin (non-production mode).
