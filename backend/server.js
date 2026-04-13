import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? '*' : (process.env.FRONTEND_URL || 'http://localhost:5173')
}));
app.use(express.json({ limit: '50kb' }));

if (isProd) {
  const publicPath = join(__dirname, 'public');
  if (existsSync(publicPath)) app.use(express.static(publicPath));
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the Argument Gym AI — a sharp, intellectually rigorous sparring partner. Your job is NOT to be helpful or agreeable. Your job is to make the user's thinking stronger by challenging it relentlessly.

CORE RULES:
- Always argue the OPPOSITE of whatever stance the user takes
- NEVER concede a point unless the user's argument is genuinely airtight
- ALWAYS end your response with a direct, pointed question that forces a specific response
- NEVER lecture, moralize, or go off-topic
- Attack the WEAKEST claim in the user's argument, not the strongest
- Keep responses sharp: 3-5 sentences max per argument, then the question
- Name logical fallacies explicitly when you spot them

DIFFICULTY MODES:
- casual: Acknowledge strong points, ask clarifying questions, conversational tone
- rigorous: Demand evidence, cite counter-examples, press on assumptions  
- brutal: Full Socratic mode — question every premise, expose hidden assumptions, no quarter

After your argument, ALWAYS append scores like this (score the USER's argument, not yours):
|||SCORES|||{"logic": 0-10, "evidence": 0-10, "originality": 0-10, "roundFeedback": "one sharp sentence about what was weak"}|||END|||

For EXTRACT_CLAIMS action respond ONLY with:
|||CLAIMS|||{"claims": ["claim 1", "claim 2", "claim 3"], "summary": "one sentence summary"}|||END|||

For FINAL_VERDICT action respond ONLY with:
|||VERDICT|||{"claimResults": [{"claim": "...", "survived": true, "note": "..."}], "overallFeedback": "2-3 sentence honest assessment", "strengths": ["..."], "weaknesses": ["..."], "scores": {"logic": 0-100, "evidence": 0-100, "originality": 0-100, "perspective": 0-100}, "clarityScore": 0-100, "verdict": "Won"}|||END|||
verdict field must be exactly "Won", "Lost", or "Draw".`;

app.post('/api/extract-claims', async (req, res) => {
  const { statement, topic, stance, difficulty } = req.body;
  if (!statement || !topic) return res.status(400).json({ error: 'Missing fields' });
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `ACTION: EXTRACT_CLAIMS\nTopic: ${topic}\nStance: ${stance}\nDifficulty: ${difficulty}\nStatement: ${statement}` }]
    });
    const text = msg.content[0].text;
    const match = text.match(/\|\|\|CLAIMS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    if (!match) return res.status(500).json({ error: 'Model format error' });
    res.json(JSON.parse(match[1]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/argue', async (req, res) => {
  const { messages, topic, stance, difficulty, claims } = req.body;
  if (!messages || !topic) return res.status(400).json({ error: 'Missing fields' });
  const sys = SYSTEM_PROMPT + `\n\nDEBATE: ${topic} | Stance: ${stance} | Difficulty: ${difficulty}\nChallenging claims:\n${(claims||[]).map((c,i)=>`${i+1}. ${c}`).join('\n')}`;
  try {
    const msg = await client.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 600, system: sys, messages });
    const text = msg.content[0].text;
    const scoreMatch = text.match(/\|\|\|SCORES\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    const argumentText = text.replace(/\|\|\|SCORES\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '').trim();
    let scores = { logic: 7, evidence: 6, originality: 7, roundFeedback: '' };
    if (scoreMatch) { try { scores = JSON.parse(scoreMatch[1]); } catch(_) {} }
    res.json({ argument: argumentText, scores });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/verdict', async (req, res) => {
  const { messages, topic, stance, difficulty, claims, sideSwitch } = req.body;
  const sys = SYSTEM_PROMPT + `\n\nDEBATE: ${topic} | Stance: ${stance} | Difficulty: ${difficulty} | Side switch: ${sideSwitch}\nClaims:\n${(claims||[]).map((c,i)=>`${i+1}. ${c}`).join('\n')}`;
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5', max_tokens: 900, system: sys,
      messages: [...messages, { role: 'user', content: 'ACTION: FINAL_VERDICT' }]
    });
    const text = msg.content[0].text;
    const match = text.match(/\|\|\|VERDICT\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    if (!match) return res.status(500).json({ error: 'Model format error' });
    res.json(JSON.parse(match[1]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

if (isProd) {
  app.get('*', (_req, res) => {
    const idx = join(__dirname, 'public', 'index.html');
    existsSync(idx) ? res.sendFile(idx) : res.status(404).send('Run npm run build first');
  });
}

app.listen(PORT, () => {
  console.log(`\n🥊 Argument Gym — port ${PORT}`);
  if (isProd) console.log(`   http://localhost:${PORT}`);
});

export default app;
