import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

import { initDB, getOrCreateUser, updateElo, getLeaderboard, getUserStats } from './db.js';
import { getSystemPrompt, SYSTEM_PROMPTS } from './prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

const io = new SocketIO(httpServer, {
  cors: {
    origin: isProd ? '*' : (process.env.FRONTEND_URL || 'http://localhost:5173'),
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: isProd ? '*' : (process.env.FRONTEND_URL || 'http://localhost:5173')
}));
app.use(express.json({ limit: '100kb' }));

if (isProd) {
  const publicPath = join(__dirname, 'public');
  if (existsSync(publicPath)) app.use(express.static(publicPath));
}

const client = new OpenAI({
  baseURL: process.env.PRIMARY_LLM_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.PRIMARY_LLM_API_KEY,
});
const MODEL = process.env.PRIMARY_LLM_MODEL || 'qwen/qwen3-plus:free';

// HvH rooms: Map<roomId, { topic, players, messages, roundScores, status }>
const rooms = new Map();

async function callLLM(systemPrompt, messages, maxTokens = 700) {
  const msg = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: systemPrompt }, ...messages]
  });
  return msg.choices[0].message.content;
}

await initDB();

// ── Health ──
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── User ──
app.post('/api/user/init', (req, res) => {
  const { userId, name } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const user = getOrCreateUser(userId, name);
  res.json(user);
});

app.get('/api/user/:id', (req, res) => {
  const user = getUserStats(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/user/:id/name', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const user = getOrCreateUser(req.params.id, name.trim());
  res.json(user);
});

// ── ELO ──
app.post('/api/elo/update', (req, res) => {
  const { userId, verdict, scores, topic, mode } = req.body;
  if (!userId || !verdict) return res.status(400).json({ error: 'Missing fields' });
  const result = updateElo(userId, verdict, scores, topic, mode || 'standard');
  res.json(result);
});

// ── Leaderboard ──
app.get('/api/leaderboard', (_req, res) => {
  res.json(getLeaderboard());
});

// ── Extract Claims ──
app.post('/api/extract-claims', async (req, res) => {
  const { statement, topic, stance, difficulty, mode } = req.body;
  if (!statement || !topic) return res.status(400).json({ error: 'Missing fields' });
  try {
    const text = await callLLM(getSystemPrompt(mode || 'standard'), [
      { role: 'user', content: `ACTION: EXTRACT_CLAIMS\nTopic: ${topic}\nStance: ${stance}\nDifficulty: ${difficulty}\nStatement: ${statement}` }
    ], 512);
    const match = text.match(/\|\|\|CLAIMS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    if (!match) return res.status(500).json({ error: 'Model format error' });
    res.json(JSON.parse(match[1]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── Argue ──
app.post('/api/argue', async (req, res) => {
  const { messages, topic, stance, difficulty, claims, mode } = req.body;
  if (!messages || !topic) return res.status(400).json({ error: 'Missing fields' });

  const sys = getSystemPrompt(mode || 'standard')
    + `\n\nDEBATE: ${topic} | Stance: ${stance} | Difficulty: ${difficulty}\nUser claims (by index):\n${(claims||[]).map((c,i)=>`${i}. ${c}`).join('\n')}`;

  try {
    const text = await callLLM(sys, messages, 700);

    const scoreMatch = text.match(/\|\|\|SCORES\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    const claimHitsMatch = text.match(/\|\|\|CLAIM_HITS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);

    const argumentText = text
      .replace(/\|\|\|SCORES\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '')
      .replace(/\|\|\|CLAIM_HITS\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '')
      .trim();

    let scores = { logic: 7, evidence: 6, originality: 7, roundFeedback: '' };
    if (scoreMatch) { try { scores = JSON.parse(scoreMatch[1]); } catch(_) {} }

    let claimHits = [false, false, false];
    if (claimHitsMatch) { try { claimHits = JSON.parse(claimHitsMatch[1]); } catch(_) {} }

    res.json({ argument: argumentText, scores, claimHits });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── Verdict ──
app.post('/api/verdict', async (req, res) => {
  const { messages, topic, stance, difficulty, claims, sideSwitch, mode } = req.body;
  const sys = getSystemPrompt(mode || 'standard')
    + `\n\nDEBATE: ${topic} | Stance: ${stance} | Difficulty: ${difficulty} | Side switch: ${sideSwitch}\nClaims:\n${(claims||[]).map((c,i)=>`${i+1}. ${c}`).join('\n')}`;

  try {
    const text = await callLLM(sys,
      [...messages, { role: 'user', content: 'ACTION: FINAL_VERDICT' }], 900);
    const match = text.match(/\|\|\|VERDICT\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    if (!match) return res.status(500).json({ error: 'Model format error' });
    res.json(JSON.parse(match[1]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── HvH REST ──
app.post('/api/hvh/create', (req, res) => {
  const { userId, name, topic } = req.body;
  if (!userId || !topic) return res.status(400).json({ error: 'Missing fields' });
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  rooms.set(roomId, {
    topic, status: 'waiting',
    players: [{ id: userId, name: name || 'Player 1', socketId: null, stance: 'for' }],
    messages: [], roundScores: [], createdAt: Date.now()
  });
  res.json({ roomId });
});

app.get('/api/hvh/room/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    topic: room.topic, status: room.status,
    playerCount: room.players.length,
    players: room.players.map(p => ({ name: p.name, stance: p.stance }))
  });
});

// ── Socket.IO HvH ──
io.on('connection', (socket) => {
  socket.on('hvh:join', ({ roomId, userId, name }) => {
    const rid = roomId.toUpperCase();
    const room = rooms.get(rid);
    if (!room) { socket.emit('hvh:error', { message: 'Room not found' }); return; }
    if (room.players.length >= 2 && !room.players.find(p => p.id === userId)) {
      socket.emit('hvh:error', { message: 'Room is full' }); return;
    }

    socket.join(rid);
    const existing = room.players.find(p => p.id === userId);
    if (existing) {
      existing.socketId = socket.id;
    } else if (room.players.length < 2) {
      room.players.push({ id: userId, name: name || 'Player 2', socketId: socket.id, stance: 'against' });
    }
    socket.data = { roomId: rid, userId };

    if (room.players.length === 2 && room.status === 'waiting') {
      room.status = 'active';
      io.to(rid).emit('hvh:start', {
        topic: room.topic,
        players: room.players.map(p => ({ id: p.id, name: p.name, stance: p.stance }))
      });
    } else {
      socket.emit('hvh:joined', {
        topic: room.topic, status: room.status,
        players: room.players.map(p => ({ id: p.id, name: p.name, stance: p.stance }))
      });
    }
  });

  socket.on('hvh:message', async ({ roomId, userId, text }) => {
    const rid = (roomId || '').toUpperCase();
    const room = rooms.get(rid);
    if (!room || room.status !== 'active') return;
    const player = room.players.find(p => p.id === userId);
    if (!player) return;

    const playerIndex = room.players.indexOf(player) + 1;
    const msgObj = { playerId: userId, playerName: player.name, playerIndex, text, ts: Date.now() };
    room.messages.push(msgObj);
    io.to(rid).emit('hvh:message', msgObj);

    // AI analysis after every 2 messages (one exchange)
    if (room.messages.length % 2 === 0) {
      try {
        const last2 = room.messages.slice(-2);
        const p1msg = last2.find(m => m.playerIndex === 1);
        const p2msg = last2.find(m => m.playerIndex === 2);
        const monitorInput = `TOPIC: ${room.topic}\nP1 (${room.players[0].name}, FOR): ${p1msg?.text || '(no message)'}\nP2 (${room.players[1].name}, AGAINST): ${p2msg?.text || '(no message)'}\nScore this exchange.`;

        const aiText = await callLLM(SYSTEM_PROMPTS.hvh_monitor,
          [{ role: 'user', content: monitorInput }], 400);
        const match = aiText.match(/\|\|\|HVH_SCORES\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
        if (match) {
          const roundScores = JSON.parse(match[1]);
          room.roundScores.push(roundScores);
          io.to(rid).emit('hvh:ai_analysis', { round: Math.floor(room.messages.length / 2), ...roundScores });
        }
      } catch (e) { console.error('HvH monitor err:', e.message); }
    }
  });

  socket.on('hvh:verdict', async ({ roomId }) => {
    const rid = (roomId || '').toUpperCase();
    const room = rooms.get(rid);
    if (!room) return;
    room.status = 'finished';
    try {
      const transcript = room.messages.map(m => `${m.playerName} (P${m.playerIndex}): ${m.text}`).join('\n\n');
      const aiText = await callLLM(SYSTEM_PROMPTS.hvh_monitor, [{
        role: 'user',
        content: `TOPIC: ${room.topic}\nP1: ${room.players[0]?.name} (FOR)\nP2: ${room.players[1]?.name} (AGAINST)\n\nTRANSCRIPT:\n${transcript}\n\nACTION: FINAL_VERDICT`
      }], 900);
      const match = aiText.match(/\|\|\|HVH_VERDICT\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
      if (match) {
        io.to(rid).emit('hvh:final_verdict', {
          verdict: JSON.parse(match[1]),
          players: room.players.map(p => ({ id: p.id, name: p.name, stance: p.stance }))
        });
      }
    } catch (e) {
      console.error('HvH verdict err:', e.message);
      io.to(rid).emit('hvh:error', { message: 'Failed to generate verdict' });
    }
  });

  socket.on('disconnect', () => {
    const { roomId, userId } = socket.data || {};
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) io.to(roomId).emit('hvh:player_left', { userId });
    }
  });
});

if (isProd) {
  app.get('*', (_req, res) => {
    const idx = join(__dirname, 'public', 'index.html');
    existsSync(idx) ? res.sendFile(idx) : res.status(404).send('Run npm run build first');
  });
}

httpServer.listen(PORT, () => {
  console.log(`\n🥊 Argument Gym — port ${PORT}`);
  if (isProd) console.log(`   http://localhost:${PORT}`);
});

export default app;
