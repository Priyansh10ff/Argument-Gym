import React from 'react';
import styles from './ClaimsConfirm.module.css';

export default function ClaimsConfirm({ claims, claimSummary, topic, onConfirm, loading }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.badge}>CLAIM EXTRACTION COMPLETE</div>
        <h2 className={styles.title}>YOUR 3 CLAIMS</h2>
        <p className={styles.sub}>The AI has identified what it will challenge. These are the pillars of your argument.</p>

        <div className={styles.claims}>
          {claims.map((claim, i) => (
            <div key={i} className={styles.claim} style={{ animationDelay: `${i * 0.1}s` }}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <p className={styles.claimText}>{claim}</p>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <span className={styles.summaryLabel}>POSITION SUMMARY</span>
          <p className={styles.summaryText}>"{claimSummary}"</p>
        </div>

        <div className={styles.warning}>
          <span className={styles.warningIcon}>!</span>
          <span>The AI will argue the opposite position. It will not be polite. It will not let you slide. Ready?</span>
        </div>

        <button className={styles.btn} onClick={onConfirm} disabled={loading}>
          {loading ? 'STARTING ROUND 1...' : 'BEGIN SPARRING →'}
        </button>
      </div>
    </div>
  );
}
