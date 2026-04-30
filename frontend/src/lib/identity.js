// Generates and persists an anonymous UUID for guest tracking
export function getUserId() {
  let id = localStorage.getItem('arg_gym_uid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('arg_gym_uid', id);
  }
  return id;
}

export function getUserName() {
  return localStorage.getItem('arg_gym_name') || '';
}

export function saveUserName(name) {
  localStorage.setItem('arg_gym_name', name);
}

// Local-only ELO for guest users (not persisted to server)
export function getLocalElo() {
  const data = localStorage.getItem('arg_gym_local_elo');
  if (!data) return { elo: 1200, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, totalDebates: 0 };
  try { return JSON.parse(data); } catch (_) {
    return { elo: 1200, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, totalDebates: 0 };
  }
}

export function updateLocalElo(verdict, mode) {
  const stats = getLocalElo();
  const K = mode === 'brutal' ? 32 : mode === 'rigorous' ? 24 : 16;
  const aiElo = mode === 'brutal' ? 2000 : mode === 'rigorous' ? 1700 : 1400;
  const expect = 1 / (1 + Math.pow(10, (aiElo - stats.elo) / 400));
  const actual = verdict === 'Won' ? 1 : verdict === 'Draw' ? 0.5 : 0;
  const delta = Math.round(K * (actual - expect));
  const newElo = Math.max(100, stats.elo + delta);

  const updated = {
    elo: newElo,
    wins: stats.wins + (verdict === 'Won' ? 1 : 0),
    losses: stats.losses + (verdict === 'Lost' ? 1 : 0),
    draws: stats.draws + (verdict === 'Draw' ? 1 : 0),
    streak: verdict === 'Won' ? stats.streak + 1 : 0,
    bestStreak: Math.max(stats.bestStreak, verdict === 'Won' ? stats.streak + 1 : 0),
    totalDebates: stats.totalDebates + 1,
  };
  localStorage.setItem('arg_gym_local_elo', JSON.stringify(updated));
  return { delta, newElo, newStreak: updated.streak };
}
