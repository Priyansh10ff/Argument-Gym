import React, { useState, useEffect } from 'react';
import styles from './Landing.module.css';
import { MODES } from '../hooks/useGym';
import { getLeaderboard, initUser } from '../lib/api';
import { getUserId, getUserName, saveUserName } from '../lib/identity';

const STARTERS = [
  'AI will replace most human jobs',
  'Universal Basic Income would help society',
  'Social media does more harm than good',
  'Nuclear energy is the future of clean power',
  'Remote work is better than office work',
  'Smartphones have made us less intelligent',
  'Capitalism is the best economic system',
  'Space exploration is worth the cost',
];

export default function Landing({ onStart }) {
  const [topic, setTopic]         = useState('');
  const [stance, setStance]       = useState('for');
  const [difficulty, setDiff]     = useState('rigorous');
  const [mode, setMode]           = useState('standard');
  const [name, setName]           = useState(getUserName());
  const [userStats, setUserStats] = useState(null);
  const [showLb, setShowLb]       = useState(false);
  const [leaderboard, setLb]      = useState(null);
  const [tab, setTab]             = useState('global');

  useEffect(() => {
    initUser(getUserId(), name || 'Anonymous')
      .then(u => setUserStats(u)).catch(() => {});
  }, []);

  const handleNameBlur = async () => {
    if (!name.trim()) return;
    saveUserName(name.trim());
    const u = await initUser(getUserId(), name.trim()).catch(() => null);
    if (u) setUserStats(u);
  };

  const openLb = async () => {
    setShowLb(true);
    const data = await getLeaderboard().catch(() => ({ global: [], daily: [] }));
    setLb(data);
  };

  const handle = (t) => {
    const finalTopic = t || topic;
    if (!finalTopic.trim()) return;
    onStart({ topic: finalTopic.trim(), stance, difficulty, mode });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.noise} />
      <div className={styles.inner}>

        {/* ELO bar */}
        {userStats && (
          <div className={styles.eloBar}>
            <div className={styles.eloLeft}>
              <span className={styles.eloRating}>⚡ {userStats.elo} ELO</span>
              <span className={styles.eloDivider}>·</span>
              <span className={styles.eloRecord}>{userStats.wins}W {userStats.losses}L {userStats.draws}D</span>
              {userStats.streak > 1 && <span className={styles.eloStreak}>🔥 {userStats.streak}</span>}
            </div>
            <button className={styles.lbOpenBtn} onClick={openLb}>LEADERBOARD</button>
          </div>
        )}

        {/* Header */}
        <div className={styles.badge}>AI SPARRING PARTNER</div>
        <h1 className={styles.title}>ARGUMENT<br />GYM</h1>
        <p className={styles.sub}>Enter the ring. Defend your position.<br />Walk out thinking sharper.</p>

        {/* Name */}
        <div className={styles.card}>
          <label className={styles.fieldLabel}>YOUR NAME (LEADERBOARD)</label>
          <input
            className={styles.input}
            placeholder="Anonymous"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleNameBlur}
            maxLength={24}
          />

          {/* Mode select */}
          <label className={styles.fieldLabel}>TRAINING MODE</label>
          <div className={styles.modeRow}>
            {Object.values(MODES).map(m => (
              <button
                key={m.id}
                className={`${styles.modeBtn} ${mode === m.id ? styles.modeActive : ''}`}
                onClick={() => setMode(m.id)}
              >
                <span className={styles.modeIcon}>{m.icon}</span>
                <span className={styles.modeName}>{m.name}</span>
              </button>
            ))}
          </div>

          {/* HvH entry */}
          <button className={styles.hvhBtn} onClick={() => onStart({ mode: 'hvh' })}>
            <span className={styles.hvhIcon}>👥</span>
            HUMAN vs HUMAN
            <span className={styles.hvhTag}>AI-MONITORED</span>
          </button>

          {/* Topic */}
          <label className={styles.fieldLabel} style={{ marginTop: '1.25rem' }}>YOUR TOPIC</label>
          <input
            className={styles.input}
            placeholder="Type anything you believe in..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
          />

          {/* Stance + Difficulty */}
          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>YOUR STANCE</label>
              <div className={styles.pills}>
                {['for', 'against'].map(s => (
                  <button key={s}
                    className={`${styles.pill} ${stance === s ? styles.pillActive : ''}`}
                    onClick={() => setStance(s)}
                  >{s.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>DIFFICULTY</label>
              <div className={styles.pills}>
                {['casual', 'rigorous', 'brutal'].map(d => (
                  <button key={d}
                    className={`${styles.pill} ${difficulty === d ? styles.pillActive : ''} ${d === 'brutal' ? styles.pillBrutal : ''}`}
                    onClick={() => setDiff(d)}
                  >{d.toUpperCase()}</button>
                ))}
              </div>
            </div>
          </div>

          <button className={styles.fightBtn} onClick={() => handle()} disabled={!topic.trim()}>
            ENTER THE GYM
          </button>
        </div>

        {/* Starter topics */}
        <div className={styles.starterSection}>
          <p className={styles.starterLabel}>OR PICK A TOPIC</p>
          <div className={styles.starterGrid}>
            {STARTERS.map(t => (
              <button key={t} className={styles.starterBtn} onClick={() => { setTopic(t); handle(t); }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard modal */}
      {showLb && (
        <div className={styles.overlay} onClick={() => setShowLb(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>LEADERBOARD</span>
              <button className={styles.modalClose} onClick={() => setShowLb(false)}>✕</button>
            </div>
            <div className={styles.tabRow}>
              <button className={`${styles.tab} ${tab === 'global' ? styles.tabActive : ''}`} onClick={() => setTab('global')}>GLOBAL</button>
              <button className={`${styles.tab} ${tab === 'daily'  ? styles.tabActive : ''}`} onClick={() => setTab('daily')}>TODAY</button>
            </div>
            {!leaderboard ? (
              <p className={styles.lbLoading}>Loading...</p>
            ) : (
              <div className={styles.lbList}>
                {(tab === 'global' ? leaderboard.global : leaderboard.daily).map((u, i) => (
                  <div key={u.id} className={`${styles.lbRow} ${u.id === getUserId() ? styles.lbSelf : ''}`}>
                    <span className={styles.lbRank}>
                      {i === 0 ? '01' : i === 1 ? '02' : i === 2 ? '03' : String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.lbName}>{u.name || 'Anonymous'}</span>
                    <span className={styles.lbElo}>
                      {tab === 'global' ? `${u.elo} ELO` : `+${u.daily_delta ?? 0}`}
                    </span>
                    {tab === 'global' && <span className={styles.lbRecord}>{u.wins}W·{u.losses}L</span>}
                  </div>
                ))}
                {(tab === 'global' ? leaderboard.global : leaderboard.daily).length === 0 && (
                  <p className={styles.lbEmpty}>No entries yet — be the first.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
