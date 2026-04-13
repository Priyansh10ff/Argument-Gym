import React, { useState } from 'react';
import styles from './Landing.module.css';

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
  const [topic, setTopic] = useState('');
  const [stance, setStance] = useState('for');
  const [difficulty, setDifficulty] = useState('rigorous');

  const handle = (t) => {
    if ((t || topic).trim()) onStart({ topic: t || topic, stance, difficulty });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.noise} />
      <div className={styles.inner}>
        <div className={styles.badge}>AI SPARRING PARTNER</div>
        <h1 className={styles.title}>ARGUMENT<br />GYM</h1>
        <p className={styles.sub}>Enter the ring. Defend your position.<br />Walk out thinking sharper.</p>

        <div className={styles.card}>
          <label className={styles.fieldLabel}>YOUR TOPIC</label>
          <input
            className={styles.input}
            placeholder="Type anything you believe in..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
          />

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>YOUR STANCE</label>
              <div className={styles.pills}>
                {['for', 'against', 'undecided'].map(s => (
                  <button key={s} className={`${styles.pill} ${stance === s ? styles.pillActive : ''}`} onClick={() => setStance(s)}>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>DIFFICULTY</label>
              <div className={styles.pills}>
                {['casual', 'rigorous', 'brutal'].map(d => (
                  <button key={d} className={`${styles.pill} ${difficulty === d ? styles.pillActive : ''} ${d === 'brutal' ? styles.pillBrutal : ''}`} onClick={() => setDifficulty(d)}>
                    {d.toUpperCase()}
                  </button>
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
              <button key={t} className={styles.starterBtn} onClick={() => { setTopic(t); handle(t); }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
