import React from 'react';
import styles from './NavBar.module.css';
import { useAuth } from '../lib/auth';

export default function NavBar({ onHome, onLobby, onProfile, active }) {
  const auth = useAuth();
  const stats = auth?.user;

  return (
    <nav className={styles.nav}>
      <button className={styles.brand} onClick={onHome}>🥊 ARGUMENT GYM</button>
      <div className={styles.center}>
        <button className={`${styles.link} ${active === 'lobby' ? styles.linkActive : ''}`} onClick={onLobby}>
          LOBBY <span className={styles.liveDot} />
        </button>
      </div>
      <div className={styles.right}>
        {stats && (
          <div className={styles.eloChip}>
            <span className={styles.eloVal}>⚡ {stats.elo}</span>
            {auth.isGuest && <span className={styles.guestPip}>LOCAL</span>}
            {stats.streak > 1 && <span className={styles.streakPip}>🔥 {stats.streak}</span>}
          </div>
        )}
        <button className={`${styles.profileBtn} ${active === 'profile' ? styles.linkActive : ''}`} onClick={onProfile}>
          {stats?.name || 'Guest'}
        </button>
      </div>
    </nav>
  );
}
