import React, { useState } from 'react';
import styles from './Landing.module.css';
import { MODES, AI_MODELS } from '../hooks/useGym';
import { useAuth } from '../lib/auth';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getLocalElo } from '../lib/identity';

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

const PERSONAS = [
  { id: 'skeptical_cfo',   label: 'Skeptical CFO',   sub: 'Demands hard ROI numbers' },
  { id: 'enthusiastic_vp', label: 'Enthusiastic VP',  sub: 'Loves vision, no budget' },
  { id: 'technical_buyer', label: 'Technical Buyer',  sub: 'Interrogates every claim' },
  { id: 'procurement',     label: 'Procurement',      sub: 'Process-obsessed, risk-averse' },
  // custom persona removed — prompt injection risk, not worth the surface area
];

const DIFFICULTY_DESC = {
  casual:   'Conversational — acknowledges good points, asks clarifying questions',
  rigorous: 'Demanding — requires evidence, presses on assumptions',
  brutal:   'Socratic — questions every premise, no quarter given',
};

export default function Landing({ onStart }) {
  const [topic,    setTopic]   = useState('');
  const [stance,   setStance]  = useState('for');
  const [diff,     setDiff]    = useState('rigorous');
  const [mode,     setMode]    = useState('standard');
  const [model,    setModel]   = useState('auto');
  const [scenario, setScen]    = useState('');
  const [persona,  setPersona] = useState('skeptical_cfo');
  const [showAdv,  setShowAdv] = useState(false);
  const [showLb,   setShowLb]  = useState(false);
  const [tab,      setTab]     = useState('global');

  const dailyTopic = useQuery(api.daily.getDailyTopic);
  const leaderboard = useQuery(api.users.getLeaderboard);

  const auth = useAuth();
  const stats = auth.isGuest ? getLocalElo() : auth.user;
  const currentUserId = auth.getUserId();

  const handleNameBlur = (e) => {
    const n = e.target.value.trim();
    if (n) auth.updateName(n);
  };

  const go = (t) => {
    const ft = (t || topic).trim();
    if (!ft) return;
    onStart({ topic: ft, stance, difficulty: diff, mode, model, scenario, persona });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.noise} />
      <div className={styles.inner}>

        {/* Top nav row */}
        <nav className={styles.navBar}>
          <div className={styles.navLeft}>
            {stats && (
              <div className={styles.navStats}>
                <span className={styles.navElo}>⚡ {stats.elo} ELO</span>
                {auth.isGuest && <span className={styles.navLocal}>LOCAL</span>}
                {(stats.streak || 0) > 1 && <span className={styles.navStreak}>🔥 {stats.streak}</span>}
              </div>
            )}
          </div>
          <div className={styles.navRight}>
            <button className={styles.lbBtn} onClick={() => setShowLb(true)}>LEADERBOARD</button>
            <button className={styles.profileBtn} onClick={() => onStart({ mode: 'profile' })}>
              👤 {auth.user?.name || 'Guest'}
            </button>
          </div>
        </nav>

        {/* Guest warning */}
        {auth.isGuest && (
          <div className={styles.guestWarning}>
            ⚠️ <strong>Guest Mode:</strong> ELO is saved locally only. Sign in via Profile to secure your rating.
          </div>
        )}

        <div className={styles.badge}>AI SPARRING PARTNER</div>
        <h1 className={styles.title}>ARGUMENT<br />GYM</h1>
        <p className={styles.sub}>Enter the ring. Defend your position.<br />Walk out thinking sharper.</p>

        {/* Daily Challenge — wired up */}
        {dailyTopic && (
          <div className={styles.daily}>
            <div className={styles.dailyHeader}>
              <span className={styles.dailyBadge}>DAILY CHALLENGE</span>
              <span className={styles.dailyRefresh}>NEW TOPIC EVERY 24H</span>
            </div>
            <button className={styles.dailyTopicBtn} onClick={() => go(dailyTopic)}>
              {dailyTopic} →
            </button>
          </div>
        )}

        <div className={styles.card}>
          {/* Name */}
          <label className={styles.fieldLabel}>YOUR NAME</label>
          <input
            className={styles.input}
            placeholder="Anonymous"
            defaultValue={auth.getPlayerName()}
            onBlur={handleNameBlur}
            maxLength={24}
          />

          {/* Mode */}
          <label className={styles.fieldLabel}>TRAINING MODE</label>
          <div className={styles.modeRow}>
            {Object.values(MODES).map(m => (
              <button
                key={m.id}
                className={`${styles.modePill} ${mode === m.id ? styles.modePillActive : ''}`}
                onClick={() => { setMode(m.id); setScen(''); setShowAdv(false); }}
              >
                {m.icon} {m.name}
              </button>
            ))}
          </div>

          {/* HvH + Lobby */}
          <div className={styles.hvhRow}>
            <button className={styles.hvhBtn} onClick={() => onStart({ mode: 'hvh' })}>
              <span>👥 HUMAN vs HUMAN</span>
              <span className={styles.hvhTag}>AI-MONITORED</span>
            </button>
            <button className={styles.lobbyBtn} onClick={() => onStart({ mode: 'lobby' })}>
              <span>🏟️ PUBLIC LOBBY</span>
              <span className={`${styles.hvhTag} ${styles.liveTag}`}>LIVE</span>
            </button>
          </div>

          {/* Topic */}
          <label className={styles.fieldLabel}>YOUR TOPIC</label>
          <input
            className={styles.input}
            placeholder="Type anything you believe in..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
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
                    className={`${styles.pill} ${diff === d ? styles.pillActive : ''} ${d === 'brutal' ? styles.pillBrutal : ''}`}
                    onClick={() => setDiff(d)}
                    title={DIFFICULTY_DESC[d]}
                  >{d.toUpperCase()}</button>
                ))}
              </div>
              {/* Difficulty descriptor */}
              <p className={styles.diffDesc}>{DIFFICULTY_DESC[diff]}</p>
            </div>
          </div>

          {/* Advanced options toggle */}
          <button className={styles.advToggle} onClick={() => setShowAdv(v => !v)}>
            {showAdv ? '▲' : '▼'} ADVANCED OPTIONS
            {showAdv ? '' : ' — Model, Scenario, Persona'}
          </button>

          {showAdv && (
            <>
              {/* AI Model Picker */}
              <label className={styles.fieldLabel} style={{ marginTop: '1rem' }}>AI MODEL</label>
              <div className={styles.modelGrid}>
                {AI_MODELS.map(m => (
                  <button
                    key={m.id}
                    className={`${styles.modelBtn} ${model === m.id ? styles.modelBtnActive : ''}`}
                    onClick={() => setModel(m.id)}
                    title={m.desc}
                  >
                    <span className={styles.modelName}>{m.name}</span>
                    <span className={styles.modelBadge}>{m.badge}</span>
                    {m.id === 'auto' && <span className={styles.freeTag}>FREE</span>}
                  </button>
                ))}
              </div>
              <p className={styles.modelDesc}>{AI_MODELS.find(m => m.id === model)?.desc}</p>

              {/* Scenario — Sales / Court only */}
              {(mode === 'sales' || mode === 'courtroom') && (
                <>
                  <label className={styles.fieldLabel} style={{ marginTop: '1rem' }}>
                    {mode === 'sales' ? 'PITCH CONTEXT (OPTIONAL)' : 'CASE FILE (OPTIONAL)'}
                  </label>
                  <textarea
                    className={styles.scenarioTextarea}
                    placeholder={mode === 'sales'
                      ? 'What are you selling? Target customer? Price point? (leave blank for generic training)'
                      : 'What are you arguing? Key facts? Your evidence? (leave blank for generic training)'}
                    value={scenario}
                    onChange={e => setScen(e.target.value)}
                    rows={3}
                  />
                </>
              )}

              {/* Persona picker — Sales only */}
              {mode === 'sales' && (
                <>
                  <label className={styles.fieldLabel} style={{ marginTop: '1rem' }}>BUYER PERSONA</label>
                  <div className={styles.personaGrid}>
                    {PERSONAS.map(p => (
                      <button
                        key={p.id}
                        className={`${styles.personaCard} ${persona === p.id ? styles.personaActive : ''}`}
                        onClick={() => setPersona(p.id)}
                      >
                        <span className={styles.personaLabel}>{p.label}</span>
                        <span className={styles.personaSub}>{p.sub}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <button className={styles.fightBtn} onClick={() => go()} disabled={!topic.trim()}>
            ENTER THE GYM
          </button>
        </div>

        {/* Starter topics */}
        <div className={styles.starterSection}>
          <p className={styles.starterLabel}>OR PICK A TOPIC</p>
          <div className={styles.starterGrid}>
            {STARTERS.map(t => (
              <button key={t} className={styles.starterBtn} onClick={() => { setTopic(t); go(t); }}>{t}</button>
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
                {(tab === 'global' ? leaderboard.global : leaderboard.daily).map((u, i) => {
                  const isMe = u._id === currentUserId || u.id === currentUserId;
                  return (
                    <div key={u._id || u.id} className={`${styles.lbRow} ${isMe ? styles.lbSelf : ''}`} ref={isMe ? (el => el?.scrollIntoView({ block: 'nearest' })) : null}>
                      <span className={styles.lbRank}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.lbName}>{u.name || 'Anonymous'}{isMe ? ' (YOU)' : ''}</span>
                      <span className={styles.lbElo}>{tab === 'global' ? `${u.elo} ELO` : `+${u.daily_delta ?? 0}`}</span>
                      {tab === 'global' && <span className={styles.lbRecord}>{u.wins}W·{u.losses}L</span>}
                    </div>
                  );
                })}
                {(tab === 'global' ? leaderboard.global : leaderboard.daily).length === 0 && (
                  <p className={styles.lbEmpty}>No entries yet — be the first.</p>
                )}
                {auth.isGuest && (
                  <p className={styles.lbGuestNote}>
                    Sign in via Profile to appear on the leaderboard.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
