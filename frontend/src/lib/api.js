const BASE = '/api';

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const extractClaims = (body) => post('/extract-claims', body);
export const argue = (body) => post('/argue', body);
export const getVerdict = (body) => post('/verdict', body);

// User / ELO
export const initUser = (userId, name) => post('/user/init', { userId, name });
export const getUser = (userId) => get(`/user/${userId}`);
export const setUserName = (userId, name) => post(`/user/${userId}/name`, { name });
export const updateElo = (body) => post('/elo/update', body);
export const getLeaderboard = () => get('/leaderboard');

// HvH
export const createHvHRoom = (body) => post('/hvh/create', body);
export const getHvHRoom = (roomId) => get(`/hvh/room/${roomId}`);
export const getHvHRooms = () => get('/hvh/rooms');
