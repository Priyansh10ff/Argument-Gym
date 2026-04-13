const BASE = '/api';

export async function extractClaims({ statement, topic, stance, difficulty }) {
  const r = await fetch(`${BASE}/extract-claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statement, topic, stance, difficulty })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function argue({ messages, topic, stance, difficulty, claims }) {
  const r = await fetch(`${BASE}/argue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, topic, stance, difficulty, claims })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getVerdict({ messages, topic, stance, difficulty, claims, sideSwitch }) {
  const r = await fetch(`${BASE}/verdict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, topic, stance, difficulty, claims, sideSwitch })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
