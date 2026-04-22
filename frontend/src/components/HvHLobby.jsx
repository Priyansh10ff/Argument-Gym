import React, { useState } from 'react';
import styles from './HvHLobby.module.css';
import { createHvHRoom, getHvHRoom } from '../lib/api';
import { getUserId, getUserName } from '../lib/identity';

export default function HvHLobby({ onEnterRoom, onBack }) {
  const [tab, setTab]           = useState('create');
  const [topic, setTopic]       = useState('');
  const [code, setCode]         = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [created, setCreated]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleCreate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError('');
    try {
      const { roomId } = await createHvHRoom({ userId: getUserId(), name: getUserName() || 'Player 1', topic: topic.trim() });
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
      if (info.playerCount >= 2 && !info.players.find(p => p.name === (getUserName() || 'Player 1'))) {
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
          Debate a real opponent. AI watches every exchange,<br />scores it live, and delivers the final verdict.
        </p>

        <div className={styles.tabRow}>
          <button className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`} onClick={() => setTab('create')}>CREATE ROOM</button>
          <button className={`${styles.tab} ${tab === 'join'   ? styles.tabActive : ''}`} onClick={() => setTab('join')}>JOIN ROOM</button>
        </div>

        <div className={styles.card}>
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
              <button className={styles.actionBtn} onClick={handleCreate} disabled={!topic.trim() || loading}>
                {loading ? 'CREATING...' : 'CREATE ROOM →'}
              </button>
            </>
          )}

          {tab === 'create' && created && (
            <div className={styles.codePanel}>
              <p className={styles.codePanelLabel}>ROOM CREATED</p>
              <div className={styles.bigCode}>{created}</div>
              <p className={styles.codeHint}>Share this code with your opponent. Waiting for them to join…</p>
              <div className={styles.waitRow}>
                {[0,1,2].map(i => <span key={i} className={styles.waitDot} style={{ animationDelay: `${i*0.2}s` }} />)}
              </div>
              <button className={styles.actionBtn} onClick={() => enter(created)}>ENTER ROOM →</button>
            </div>
          )}

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
                {roomInfo.playerCount}/2 players ·{' '}
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
            'Create a room and share the 8-character code with your opponent',
            'Player 1 argues FOR the topic. Player 2 argues AGAINST',
            'AI scores every exchange in real time — visible to both players',
            'Request the final verdict at any time to end the debate',
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
