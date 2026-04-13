import React from 'react';
import styles from './Loader.module.css';

export default function Loader({ message = 'Processing...', sub = '' }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.bars}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.bar} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p className={styles.msg}>{message}</p>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
    </div>
  );
}
