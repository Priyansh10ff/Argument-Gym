import React from 'react';
import styles from './HealthBar.module.css';

export default function HealthBar({ claims, claimsHp, maxHp }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.title}>CLAIM HEALTH</p>
      {claims.map((claim, i) => {
        const hp  = claimsHp?.[i] ?? maxHp;
        const pct = (hp / maxHp) * 100;
        const gone = hp === 0;
        return (
          <div key={i} className={`${styles.row} ${gone ? styles.broken : ''}`}>
            <div className={styles.header}>
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.text}>{claim.length > 44 ? claim.slice(0, 44) + '…' : claim}</span>
              {gone && <span className={styles.brokenTag}>BROKEN</span>}
            </div>
            <div className={styles.barBg}>
              {gone
                ? <div className={styles.barCracked} />
                : <div
                    className={styles.barFill}
                    style={{
                      width: `${pct}%`,
                      background: pct > 66 ? '#4CAF50' : pct > 33 ? 'var(--yellow)' : 'var(--red)',
                    }}
                  />
              }
            </div>
            <div className={styles.pips}>
              {Array.from({ length: maxHp }).map((_, j) => (
                <span key={j} className={`${styles.pip} ${j < hp ? styles.pipOn : styles.pipOff}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
