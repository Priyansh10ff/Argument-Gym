import React, { useState, useEffect } from 'react';
import styles from './HvHLobby.module.css';
import { createHvHRoom, getHvHRoom, getHvHRooms } from '../lib/api';
import { getUserId, getUserName } from '../lib/identity';

export default function HvHLobby({ onEnterRoom, onBack }) {
  const [tab, setTab]             = useState('lobby');
  const [topic, setTopic]         = useState('');
  const [minPlayers, setMinPlayers] = useState(2);
  const [code, setCode]           = useState('');
  const [roomInfo, setRoomInfo]   = useState(null);
  const [created, setCreated]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [rooms, setRooms]         = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const loadRooms = async () => {
    setRoomsLoading(true);
    try { setRooms(await getHvHRooms()); } catch (_) {}
    setRoomsLoading(false);
  };

  useEffect(() => {
    if (tab === 'lobby') loadRooms();
  }, [tab]);

  const handleCreate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError('');
    try {
      const { roomId } = await createHvHRoom({
        userId: getUserId(), name: getUserName() || 'Player 1',
        topic: topic.trim(), minPlayers
      });
      setCreated(roomId);
    } catch (_) { setError('Failed to create room.'); }
    setLoading(false);
  };

  const handleFind = async () => {
    const rid = code.trim().toUpperCase();
    if (!rid) return;
    setLoading(true); setError('');
    try {
      const info = await getHvHRoom(rid);
      if (info.playerCount >= info.minPlayers && !info.players.find(p => p.name === (getUserName() || 'Player 1'))) {
        setError('Room is full.'); setLoading(false); return;
      }
      setRoomInfo({ ...info, roomId: rid });
    } catch (_) { setError('Room not found. Check the code.'); }
    setLoading(false);
  };

  const enter = (roomId) => onEnterRoom({ roomId, userId: getUserId(), name: getUserName() || 'Anonymous' });

  return (
    <div className={styles.wrap}>
      <div className={styles.noise} />
      <div className={styles.inner}>
        <button className={styles.back} onClick={onBack}>← BACK</button>

        <div className={styles.badge}>AI-MONITORED</div>
        <h1 className={styles.title}>HUMAN<br />vs HUMAN</h1>
        <p className={styles.sub}>
          Debate real opponents. AI watches every exchange,<br />scores it live, and delivers the final verdict.
        </p>

        <div className={styles.tabRow}>
          <button className={`${styles.tab} ${tab === 'lobby'  ? styles.tabActive : ''}`} onClick={() => setTab('lobby')}>LOBBY</button>
          <button className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`} onClick={() => setTab('create')}>CREATE</button>
          <button className={`${styles.tab} ${tab === 'join'   ? styles.tabActive : ''}`} onClick={() => setTab('join')}>JOIN BY CODE</button>
        </div>

        <div className={styles.card}>

          {/* ── LOBBY TAB ── */}
          {tab === 'lobby' && (
            <>
              <div className={styles.lobbyHeader}>
                <span className={styles.fieldLabel}>OPEN ROOMS</span>
                <button className={styles.refreshBtn} onClick={loadRooms} disabled={roomsLoading}>
                  {roomsLoading ? '…' : '↺ REFRESH'}
                </button>
              </div>
              {rooms.length === 0 && !roomsLoading && (
                <p className={styles.emptyState}>No open rooms yet. Create one!</p>
              )}
              {rooms.map(r => (
                <div key={r.roomId} className={styles.roomRow}>
                  <div className={styles.roomInfo}>
                    <p className={styles.roomTopic}>{r.topic}</p>
                    <p className={styles.roomMeta}>
                      <span className={`${styles.roomStatus} ${r.status === 'active' ? styles.statusActive : styles.statusWaiting}`}>
                        {r.status === 'active' ? 'ACTIVE' : 'WAITING'}
                      </span>
                      {r.playerCount}/{r.minPlayers} players
                      <span className={styles.roomCode}>{r.roomId}</span>
                    </p>
                  </div>
                  {r.status === 'waiting' && r.playerCount < r.minPlayers && (
                    <button className={styles.joinRowBtn} onClick={() => enter(r.roomId)}>JOIN →</button>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── CREATE TAB ── */}
          {tab === 'create' && !created && (
            <>
              <label className={styles.fieldLabel}>DEBATE TOPIC</label>
              <input
                className={styles.input}
                placeholder="Enter a topic..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <label className={styles.fieldLabel}>PLAYERS PER SIDE</label>
              <div className={styles.playerSelect}>
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    className={`${styles.playerBtn} ${minPlayers === n * 2 ? styles.playerBtnActive : ''}`}
                    onClick={() => setMinPlayers(n * 2)}
                  >
                    {n}v{n}
                  </button>
                ))}
              </div>
              <p className={styles.playerHint}>{minPlayers} players needed to start</p>
              <button className={styles.actionBtn} onClick={handleCreate} disabled={!topic.trim() || loading}>
                {loading ? 'CREATING...' : 'CREATE ROOM →'}
              </button>
            </>
          )}

          {tab === 'create' && created && (
            <div className={styles.codePanel}>
              <p className={styles.codePanelLabel}>ROOM CREATED</p>
              <div className={styles.bigCode}>{created}</div>
              <p className={styles.codeHint}>Share this code. Waiting for players to join…</p>
              <p className={styles.playerNeed}>Needs {minPlayers} players to start</p>
              <div className={styles.waitRow}>
                {[0,1,2].map(i => <span key={i} className={styles.waitDot} style={{ animationDelay: `${i*0.2}s` }} />)}
              </div>
              <button className={styles.actionBtn} onClick={() => enter(created)}>ENTER ROOM →</button>
            </div>
          )}

          {/* ── JOIN TAB ── */}
          {tab === 'join' && !roomInfo && (
            <>
              <label className={styles.fieldLabel}>ROOM CODE</label>
              <input
                className={`${styles.input} ${styles.codeInput}`}
                placeholder="XXXXXXXX"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                onKeyDown={e => e.key === 'Enter' && handleFind()}
              />
              <button className={styles.actionBtn} onClick={handleFind} disabled={!code.trim() || loading}>
                {loading ? 'SEARCHING...' : 'FIND ROOM →'}
              </button>
            </>
          )}

          {tab === 'join' && roomInfo && (
            <div className={styles.foundPanel}>
              <p className={styles.foundLabel}>ROOM FOUND</p>
              <p className={styles.foundTopic}>{roomInfo.topic}</p>
              <p className={styles.foundStatus}>
                {roomInfo.playerCount}/{roomInfo.minPlayers} players ·{' '}
                {roomInfo.status === 'waiting' ? 'waiting for players' : 'active'}
              </p>
              <button className={styles.actionBtn} onClick={() => enter(roomInfo.roomId)}>JOIN DEBATE →</button>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.howCard}>
          <p className={styles.howLabel}>HOW IT WORKS</p>
          {[
            'Create a room and pick how many players per side (1v1 up to 4v4)',
            'Share the room code — or players can find it in the Lobby',
            'Game starts when the minimum player count is reached, or creator starts early',
            'AI scores every exchange in real time and delivers the final verdict',
          ].map((step, i) => (
            <div key={i} className={styles.howRow}>
              <span className={styles.howNum}>{String(i+1).padStart(2,'0')}</span>
              <span className={styles.howText}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
