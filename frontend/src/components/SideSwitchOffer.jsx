import React from 'react';
import styles from './SideSwitchOffer.module.css';

export default function SideSwitchOffer({ stance, onAccept, onDecline, loading }) {
  const opposite = stance === 'for' ? 'AGAINST' : 'FOR';
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.badge}>SIDE SWITCH UNLOCKED</div>
        <h2 className={styles.title}>FLIP THE SCRIPT</h2>
        <p className={styles.sub}>
          You've survived {3} rounds. Now argue the <strong>{opposite}</strong> side — 
          the position you've been fighting against. This is where understanding is proven.
        </p>

        <div className={styles.splitCard}>
          <div className={styles.side}>
            <span className={styles.sideLabel}>YOUR ORIGINAL POSITION</span>
            <span className={styles.sideName}>{stance.toUpperCase()}</span>
            <p className={styles.sideDesc}>You've defended this. Now you'll attack it.</p>
          </div>
          <div className={styles.arrow}>⇄</div>
          <div className={styles.side + ' ' + styles.sideNew}>
            <span className={styles.sideLabel}>NEW POSITION</span>
            <span className={styles.sideName}>{opposite}</span>
            <p className={styles.sideDesc}>Argue the opposite. Earn the Perspective score.</p>
          </div>
        </div>

        <div className={styles.reward}>
          <span className={styles.rewardIcon}>+</span>
          <div>
            <p className={styles.rewardTitle}>Unlocks PERSPECTIVE score axis</p>
            <p className={styles.rewardSub}>Only awarded to debaters who can argue both sides. Rare. Worth it.</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.switchBtn} onClick={onAccept} disabled={loading}>
            {loading ? 'SWITCHING SIDES...' : 'SWITCH SIDES →'}
          </button>
          <button className={styles.skipBtn} onClick={onDecline} disabled={loading}>
            STAY MY COURSE
          </button>
        </div>
      </div>
    </div>
  );
}
