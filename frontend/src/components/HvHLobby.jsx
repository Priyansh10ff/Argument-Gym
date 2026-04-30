import React, { useState } from 'react';
import styles from './HvHLobby.module.css';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../lib/auth';
import InviteLink from './InviteLink';

export default function HvHLobby({ onEnterRoom, onBack }) {
  const [tab, setTab]           = useState('create');
  const [topic, setTopic]       = useState('');
  const [code, setCode]         = useState('');
  const [created, setCreated]   = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const auth = useAuth();
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const foundRoom = useQuery(
    api.rooms.getRoomByCode,
    code.trim().length === 8 ? { roomCode: code.trim().toUpperCase() } : 'skip'
  );

  const handleCreate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError('');
    try {
      const result = await createRoom({
        topic: topic.trim(),
        hostId: auth.getPlayerId(),
        hostName: auth.getPlayerName(),
        isPublic,
      });
      setCreated(result);
    } catch (e) { setError('Failed to create room.'); }
    setLoading(false);
  };

  const handleJoin = async () => {
    const rid = code.trim().toUpperCase();
    if (!rid) return;
    setLoading(true); setError('');
    try {
      const room = await joinRoom({
        roomCode: rid,
        playerId: auth.getPlayerId(),
        playerName: auth.getPlayerName(),
      });
      onEnterRoom({
        roomId: room._id,
        roomCode: rid,
        userId: auth.getPlayerId(),
        name: auth.getPlayerName(),
      });
    } catch (e) {
      setError(e.message || 'Room not found or full.');
    }
    setLoading(false);
  };

  const enter = () => {
    if (created) {
      onEnterRoom({
        roomId: created.roomId,
        roomCode: created.roomCode,
        userId: auth.getPlayerId(),
        name: auth.getPlayerName(),
      });
    }
  };

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

              {/* Public toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>PUBLIC ROOM</label>
                <button
                  style={{
                    background: isPublic ? '#1D9E75' : 'var(--gray-light)',
                    border: 'none', width: 40, height: 22, borderRadius: 11,
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onClick={() => setIsPublic(!isPublic)}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: isPublic ? 20 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: 'var(--white)',
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {isPublic ? 'Visible in lobby' : 'Invite only'}
                </span>
              </div>

              <button className={styles.actionBtn} onClick={handleCreate} disabled={!topic.trim() || loading}>
                {loading ? 'CREATING...' : 'CREATE ROOM →'}
              </button>
            </>
          )}

          {tab === 'create' && created && (
            <div className={styles.codePanel}>
              <p className={styles.codePanelLabel}>ROOM CREATED</p>
              <InviteLink roomCode={created.roomCode} />
              <div className={styles.waitRow}>
                {[0,1,2].map(i => <span key={i} className={styles.waitDot} style={{ animationDelay: `${i*0.2}s` }} />)}
              </div>
              <button className={styles.actionBtn} onClick={enter}>ENTER ROOM →</button>
            </div>
          )}

          {tab === 'join' && (
            <>
              <label className={styles.fieldLabel}>ROOM CODE</label>
              <input
                className={`${styles.input} ${styles.codeInput}`}
                placeholder="XXXXXXXX"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              {foundRoom && (
                <div className={styles.foundPanel}>
                  <p className={styles.foundLabel}>ROOM FOUND</p>
                  <p className={styles.foundTopic}>{foundRoom.topic}</p>
                  <p className={styles.foundStatus}>
                    {foundRoom.playerIds.length}/2 players ·{' '}
                    {foundRoom.status === 'waiting' ? 'waiting for players' : foundRoom.status}
                  </p>
                </div>
              )}
              <button className={styles.actionBtn} onClick={handleJoin} disabled={!code.trim() || loading}>
                {loading ? 'JOINING...' : 'JOIN ROOM →'}
              </button>
            </>
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
