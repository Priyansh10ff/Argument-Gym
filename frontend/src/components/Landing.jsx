import React, { useState, useEffect } from 'react';
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
  { id: 'skeptical_cfo',  label: 'Skeptical CFO',    sub: 'Demands hard ROI numbers' },
  { id: 'enthusiastic_vp',label: 'Enthusiastic VP',   sub: 'Loves vision, no budget' },
  { id: 'technical_buyer', label: 'Technical Buyer',  sub: 'Interrogates every claim' },
  { id: 'procurement',    label: 'Procurement',       sub: 'Process-obsessed, risk-averse' },
];

export default function Landing({ onStart }) {
  const [topic, setTopic]       = useState('');
  const [stance, setStance]     = useState('for');
  const [difficulty, setDiff]   = useState('rigorous');
  const [mode, setMode]         = useState('standard');
  const [model, setModel]       = useState('auto');
  const [scenario, setScenario] = useState('');
  const [persona, setPersona]   = useState('skeptical_cfo');
  const [showLb, setShowLb]     = useState(false);
  const [tab, setTab]           = useState('global');

  const auth = useAuth();
  const userStats = auth.user;
  const guestStats = auth.isGuest ? getLocalElo() : null;
  const stats = auth.isGuest ? guestStats : userStats;

  // Reactive leaderboard
  const leaderboard = useQuery(api.users.getLeaderboard);

  const handleNameBlur = async (e) => {
    const n = e.target.value.trim();
    if (!n) return;
    auth.updateName(n);
  };

  const handle = (t) => {
    const finalTopic = (t || topic).trim();
    if (!finalTopic) return;
    onStart({ topic: finalTopic, stance, difficulty, mode, model, scenario, persona });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.noise} />
      <div className={styles.inner}>

        {/* Navbar */}
        <nav className={styles.navBar}>
          <div className={styles.navLeft}>
            {stats && (
              <div className={styles.navStats}>
                <span className={styles.navElo}>⚡ {stats.elo} ELO</span>
                {auth.isGuest && <span className={styles.navLocal}>LOCAL</span>}
              </div>
            )}
          </div>
          <div className={styles.navRight}>
            <button className={styles.lbBtn} onClick={() => setShowLb(true)}>LEADERBOARD</button>
            <button className={styles.profileBtn} onClick={() => onStart({ mode: 'profile' })}>
              <span className={styles.profileAvatar}>👤</span>
              <span className={styles.profileName}>{auth.user?.name || 'Guest'}</span>
            </button>
          </div>
        </nav>

        {/* Guest Warning */}
        {auth.isGuest && (
          <div className={styles.guestWarning}>
             <span>⚠️ <strong>Guest Mode:</strong> Your progress is saved locally. Connect a Google account in your Profile to permanently secure your ELO.</span>
          </div>
        )}

        <div className={styles.badge}>AI SPARRING PARTNER</div>
        <h1 className={styles.title}>ARGUMENT<br />GYM</h1>
        <p className={styles.sub}>Enter the ring. Defend your position.<br />Walk out thinking sharper.</p>

        <div className={styles.card}>
          {/* Name */}
          <label className={styles.fieldLabel}>YOUR NAME (LEADERBOARD)</label>
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
                onClick={() => { setMode(m.id); setScenario(''); }}
              >
                {m.icon} {m.name}
              </button>
            ))}
          </div>

          {/* HvH */}
          <button className={styles.hvhBtn} onClick={() => onStart({ mode: 'hvh' })}>
            <span>👥 HUMAN vs HUMAN</span>
            <span className={styles.hvhTag}>AI-MONITORED</span>
          </button>

          {/* Public Lobby */}
          <button className={styles.hvhBtn} onClick={() => onStart({ mode: 'lobby' })} style={{ marginTop: '0.5rem', borderColor: 'var(--yellow)' }}>
            <span>🏟️ PUBLIC LOBBY</span>
            <span className={styles.hvhTag} style={{ background: 'var(--yellow)', color: 'var(--black)' }}>LIVE</span>
          </button>

          {/* Scenario — Sales / Court only */}
          {(mode === 'sales' || mode === 'courtroom') && (
            <div className={styles.scenarioBlock}>
              <label className={styles.fieldLabel}>
                {mode === 'sales' ? 'PITCH CONTEXT (OPTIONAL)' : 'CASE FILE (OPTIONAL)'}
              </label>
              <textarea
                className={styles.scenarioTextarea}
                placeholder={mode === 'sales'
                  ? 'What are you selling? Target customer? Price point? (leave blank for generic training)'
                  : 'What are you arguing? Key facts? Your evidence? (leave blank for generic training)'}
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Persona picker — Sales only */}
          {mode === 'sales' && (
            <div className={styles.personaBlock}>
              <label className={styles.fieldLabel}>BUYER PERSONA</label>
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
            </div>
          )}

          {/* AI Model Picker */}
          <label className={styles.fieldLabel} style={{ marginTop: '1rem' }}>AI MODEL</label>
          <div className={styles.modeRow} style={{ flexWrap: 'wrap' }}>
            {AI_MODELS.map(m => (
              <button
                key={m.id}
                className={`${styles.modePill} ${model === m.id ? styles.modePillActive : ''}`}
                onClick={() => setModel(m.id)}
                title={m.desc}
              >
                {m.name}
                <span style={{
                  fontSize: '0.55rem', marginLeft: '0.35rem', opacity: 0.6,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                }}>{m.badge}</span>
              </button>
            ))}
          </div>

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
                  <div key={u.id} className={`${styles.lbRow} ${u.id === auth.getUserId() ? styles.lbSelf : ''}`}>
                    <span className={styles.lbRank}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.lbName}>{u.name || 'Anonymous'}</span>
                    <span className={styles.lbElo}>{tab === 'global' ? `${u.elo} ELO` : `+${u.daily_delta ?? 0}`}</span>
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
