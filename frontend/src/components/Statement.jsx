import React from 'react';
import styles from './Statement.module.css';

export default function Statement({ topic, stance, difficulty, statement, setStatement, onSubmit, onBack, loading }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <button className={styles.back} onClick={onBack}>← BACK</button>

        <div className={styles.meta}>
          <span className={styles.metaItem}>{topic}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.metaItem}>{stance.toUpperCase()}</span>
          <span className={styles.dot}>·</span>
          <span className={`${styles.metaItem} ${difficulty === 'brutal' ? styles.brutal : ''}`}>{difficulty.toUpperCase()}</span>
        </div>

        <h2 className={styles.title}>MAKE YOUR CASE</h2>
        <p className={styles.sub}>Write your opening argument. Be specific. The AI will identify your 3 core claims and challenge each one.</p>

        <textarea
          className={styles.textarea}
          placeholder="State your position clearly. The stronger your argument, the better the sparring..."
          value={statement}
          onChange={e => setStatement(e.target.value)}
          rows={6}
          autoFocus
        />

        <div className={styles.footer}>
          <span className={styles.hint}>{statement.length > 0 ? `${statement.split(' ').filter(Boolean).length} words` : 'Aim for 2-5 sentences'}</span>
          <button className={styles.btn} onClick={onSubmit} disabled={statement.trim().length < 20 || loading}>
            {loading ? 'ANALYZING...' : 'SUBMIT ARGUMENT →'}
          </button>
        </div>
      </div>
    </div>
  );
}
