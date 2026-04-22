import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'data.sqlite');

let db;

export async function initDB() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT 'Anonymous',
      elo INTEGER DEFAULT 1200,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      total_debates INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      date TEXT,
      elo_delta INTEGER,
      topic TEXT,
      verdict TEXT,
      mode TEXT DEFAULT 'standard',
      logic_score INTEGER DEFAULT 0,
      evidence_score INTEGER DEFAULT 0,
      originality_score INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS hvh_rooms (
      id TEXT PRIMARY KEY,
      topic TEXT,
      status TEXT DEFAULT 'waiting',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  persist();
  console.log('✅ Database ready');
}

function persist() {
  try {
    const data = db.export();
    writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('DB persist error:', e.message);
  }
}

// ─── User CRUD ───────────────────────────────────────────────────────────────

export function getOrCreateUser(id, name) {
  const row = db.exec(`SELECT * FROM users WHERE id = ?`, [id]);
  if (row.length && row[0].values.length) {
    const cols = row[0].columns;
    const vals = row[0].values[0];
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  }
  db.run(
    `INSERT INTO users (id, name) VALUES (?, ?)`,
    [id, name || 'Anonymous']
  );
  persist();
  return { id, name: name || 'Anonymous', elo: 1200, wins: 0, losses: 0, draws: 0, streak: 0, best_streak: 0, total_debates: 0 };
}

export function updateElo(userId, verdictResult, scores, topic, mode) {
  const user = getOrCreateUser(userId);

  // ELO difficulty K-factors: casual=16, rigorous=24, brutal=32
  const K = mode === 'brutal' ? 32 : mode === 'rigorous' ? 24 : 16;

  // Treat AI as 1400 (casual), 1700 (rigorous), 2000 (brutal)
  const aiElo = mode === 'brutal' ? 2000 : mode === 'rigorous' ? 1700 : 1400;

  const expected = 1 / (1 + Math.pow(10, (aiElo - user.elo) / 400));
  const actual = verdictResult === 'Won' ? 1 : verdictResult === 'Draw' ? 0.5 : 0;
  const delta = Math.round(K * (actual - expected));
  const newElo = Math.max(100, user.elo + delta);

  const newWins = user.wins + (verdictResult === 'Won' ? 1 : 0);
  const newLosses = user.losses + (verdictResult === 'Lost' ? 1 : 0);
  const newDraws = user.draws + (verdictResult === 'Draw' ? 1 : 0);
  const newStreak = verdictResult === 'Won' ? user.streak + 1 : 0;
  const newBestStreak = Math.max(user.best_streak, newStreak);

  db.run(
    `UPDATE users SET elo=?, wins=?, losses=?, draws=?, streak=?, best_streak=?, total_debates=total_debates+1 WHERE id=?`,
    [newElo, newWins, newLosses, newDraws, newStreak, newBestStreak, userId]
  );

  const today = new Date().toISOString().slice(0, 10);
  db.run(
    `INSERT INTO daily_scores (user_id, date, elo_delta, topic, verdict, mode, logic_score, evidence_score, originality_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, today, delta, topic, verdictResult, mode,
      scores?.logic || 0, scores?.evidence || 0, scores?.originality || 0]
  );

  persist();
  return { delta, newElo, newStreak };
}

export function getLeaderboard() {
  const today = new Date().toISOString().slice(0, 10);

  const global = db.exec(
    `SELECT id, name, elo, wins, losses, draws, streak, best_streak, total_debates
     FROM users ORDER BY elo DESC LIMIT 50`
  );

  const daily = db.exec(
    `SELECT u.id, u.name, u.elo, SUM(ds.elo_delta) as daily_delta, COUNT(*) as daily_debates
     FROM daily_scores ds
     JOIN users u ON u.id = ds.user_id
     WHERE ds.date = ?
     GROUP BY ds.user_id
     ORDER BY daily_delta DESC
     LIMIT 50`,
    [today]
  );

  const toObjects = (result) => {
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map(v => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
  };

  return { global: toObjects(global), daily: toObjects(daily) };
}

export function getUserStats(userId) {
  const row = db.exec(`SELECT * FROM users WHERE id = ?`, [userId]);
  if (!row.length || !row[0].values.length) return null;
  const cols = row[0].columns;
  const vals = row[0].values[0];
  const user = Object.fromEntries(cols.map((c, i) => [c, vals[i]]));

  const history = db.exec(
    `SELECT * FROM daily_scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );

  const rank = db.exec(
    `SELECT COUNT(*) + 1 as rank FROM users WHERE elo > (SELECT elo FROM users WHERE id = ?)`,
    [userId]
  );

  user.history = history.length ? history[0].values.map(v =>
    Object.fromEntries(history[0].columns.map((c, i) => [c, v[i]]))) : [];
  user.rank = rank[0]?.values[0]?.[0] ?? 1;

  return user;
}
