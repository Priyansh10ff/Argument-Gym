import React, { useState } from 'react';
import styles from './PublicLobby.module.css';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../lib/auth';

export default function PublicLobby({ onJoinRoom, onSpectate, onBack }) {
  const [filter, setFilter] = useState('all');
  const rooms = useQuery(api.rooms.getPublicLobby) || [];
  const auth = useAuth();

  const filtered = filter === 'all'
    ? rooms
    : rooms.filter(r => r.status === filter);

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.noise} />
      <div className={styles.inner}>
        <button className={styles.back} onClick={onBack}>← BACK</button>

        <div className={styles.badge}>LIVE DEBATES</div>
        <h1 className={styles.title}>PUBLIC<br />LOBBY</h1>
        <p className={styles.sub}>
          Watch ongoing debates or jump into an open room.
          <br />Everything updates in real time.
        </p>

        <div className={styles.filterRow}>
          {['all', 'waiting', 'active'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
          <span className={styles.liveCount}>
            <span className={styles.liveDot} />
            {rooms.length} ROOM{rooms.length !== 1 ? 'S' : ''}
          </span>
        </div>

        <div className={styles.roomList}>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>🏟️</p>
              <p className={styles.emptyText}>
                No {filter === 'all' ? '' : filter} rooms right now.
                <br />Create one from the HvH lobby!
              </p>
            </div>
          )}

          {filtered.map(room => (
            <div key={room._id} className={styles.roomCard}>
              <div className={styles.roomTop}>
                <span className={`${styles.statusDot} ${styles[`status_${room.status}`]}`} />
                <span className={styles.roomTopic}>{room.topic}</span>
                <span className={styles.roomTime}>{timeAgo(room.createdAt)}</span>
              </div>
              <div className={styles.roomMeta}>
                <span className={styles.roomPlayers}>
                  👥 {room.playerCount}/2
                  {room.playerNames.length > 0 && ` · ${room.playerNames.join(' vs ')}`}
                </span>
                {room.spectatorCount > 0 && (
                  <span className={styles.roomSpectators}>👁 {room.spectatorCount}</span>
                )}
                <span className={styles.roomCode}>#{room.roomCode}</span>
              </div>
              <div className={styles.roomActions}>
                {room.status === 'waiting' && (
                  <button
                    className={styles.joinBtn}
                    onClick={() => onJoinRoom({
                      roomCode: room.roomCode,
                      roomId: room._id,
                      userId: auth.getPlayerId(),
                      name: auth.getPlayerName(),
                    })}
                  >
                    JOIN →
                  </button>
                )}
                {room.status === 'active' && (
                  <button
                    className={styles.spectateBtn}
                    onClick={() => onSpectate({ roomId: room._id, roomCode: room.roomCode })}
                  >
                    👁 SPECTATE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
