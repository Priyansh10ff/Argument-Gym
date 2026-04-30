import React from 'react';
import styles from './Profile.module.css';
import { useAuth } from '../lib/auth';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Profile({ onBack }) {
  const auth = useAuth();
  
  // Always query userStats based on user ID
  // For guests, auth.user might be null until convex syncs, so we use getUserByGuestId if needed
  const guestUser = useQuery(api.users.getUserByGuestId, auth.isGuest ? { guestId: auth.getGuestId() } : "skip");
  const currentUser = auth.isGuest ? guestUser : auth.user;
  
  const userStats = useQuery(api.users.getUserStats, currentUser?._id ? { userId: currentUser._id } : "skip");
  const weaknessProfile = useQuery(api.weaknessProfiles.get, currentUser?._id ? { userId: currentUser._id } : "skip");

  if (!currentUser || !userStats) {
    return (
      <div className={styles.wrap}>
         <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  const { history, rank } = userStats;
  const wp = weaknessProfile;

  const parseJSON = (str, fallback) => {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch {
      return fallback;
    }
  };

  const commonW = wp ? parseJSON(wp.commonWeaknesses, []) : [];
  const fallacyH = wp ? parseJSON(wp.fallacyHits, {}) : {};

  return (
    <div className={styles.wrap}>
       <div className={styles.noise} />
       <div className={styles.inner}>
         <button className={styles.backBtn} onClick={onBack}>← BACK TO GYM</button>
         
         <div className={styles.header}>
            <div className={styles.avatar}>👤</div>
            <div className={styles.headerInfo}>
               <h1 className={styles.name}>{currentUser.name || 'Anonymous'}</h1>
               <span className={auth.isGuest ? styles.badgeGuest : styles.badgeGoogle}>
                  {auth.isGuest ? 'GUEST ACCOUNT' : 'GOOGLE LINKED'}
               </span>
            </div>
         </div>

         <div className={styles.grid}>
            {/* Stats Card */}
            <div className={styles.card}>
               <h2 className={styles.cardTitle}>OVERVIEW</h2>
               <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                     <span className={styles.statLabel}>GLOBAL ELO</span>
                     <span className={styles.statValElo}>{currentUser.elo}</span>
                  </div>
                  <div className={styles.statBox}>
                     <span className={styles.statLabel}>RANK</span>
                     <span className={styles.statVal}>#{rank || '-'}</span>
                  </div>
                  <div className={styles.statBox}>
                     <span className={styles.statLabel}>RECORD</span>
                     <span className={styles.statVal}>{currentUser.wins}W {currentUser.losses}L {currentUser.draws}D</span>
                  </div>
                  <div className={styles.statBox}>
                     <span className={styles.statLabel}>STREAK</span>
                     <span className={styles.statVal}>{currentUser.streak} <span className={styles.statBest}>(Best: {currentUser.bestStreak})</span></span>
                  </div>
               </div>
            </div>

            {/* Weakness Card */}
            <div className={styles.card}>
               <h2 className={styles.cardTitle}>WEAKNESS PROFILE</h2>
               {wp ? (
                 <div className={styles.wpContent}>
                   <div className={styles.wpScores}>
                     <div className={styles.wpScore}>
                       <span className={styles.wpLabel}>Logic</span>
                       <span className={styles.wpNum}>{wp.logicAvg.toFixed(1)}</span>
                     </div>
                     <div className={styles.wpScore}>
                       <span className={styles.wpLabel}>Evidence</span>
                       <span className={styles.wpNum}>{wp.evidenceAvg.toFixed(1)}</span>
                     </div>
                     <div className={styles.wpScore}>
                       <span className={styles.wpLabel}>Originality</span>
                       <span className={styles.wpNum}>{wp.originalityAvg.toFixed(1)}</span>
                     </div>
                   </div>
                   {commonW.length > 0 && (
                     <div className={styles.wpSection}>
                       <p className={styles.wpLabelSub}>Recurring Weaknesses</p>
                       <ul className={styles.wpList}>
                         {commonW.map((w, i) => <li key={i}>{w}</li>)}
                       </ul>
                     </div>
                   )}
                   {Object.keys(fallacyH).length > 0 && (
                     <div className={styles.wpSection}>
                       <p className={styles.wpLabelSub}>Detected Fallacies</p>
                       <div className={styles.fallacyTags}>
                         {Object.entries(fallacyH).map(([f, count]) => (
                           <span key={f} className={styles.fallacyTag}>{f} <span className={styles.fallacyCount}>{count}</span></span>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <p className={styles.emptyText}>Not enough data yet. Complete a debate to build your profile.</p>
               )}
            </div>

            {/* History Card */}
            <div className={`${styles.card} ${styles.fullWidth}`}>
               <h2 className={styles.cardTitle}>RECENT MATCHES</h2>
               {history && history.length > 0 ? (
                 <div className={styles.historyList}>
                   {history.map(match => (
                     <div key={match._id} className={styles.historyItem}>
                       <div className={styles.historyLeft}>
                         <span className={`${styles.verdict} ${styles['verdict' + match.verdict]}`}>{match.verdict}</span>
                         <span className={styles.historyTopic}>{match.topic}</span>
                       </div>
                       <div className={styles.historyRight}>
                         <span className={styles.historyMode}>{match.mode}</span>
                         <span className={match.eloDelta >= 0 ? styles.deltaPos : styles.deltaNeg}>
                           {match.eloDelta > 0 ? '+' : ''}{match.eloDelta}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <p className={styles.emptyText}>No matches found.</p>
               )}
            </div>
         </div>

         {/* Account Actions */}
         <div className={styles.actions}>
            {auth.isGuest ? (
              <div className={styles.upgradeBox}>
                <p className={styles.upgradeText}>You are playing as a Guest. Sign in with Google to save your ELO and profile permanently.</p>
                <button className={styles.googleBtn} onClick={auth.signInWithGoogle}>
                  Sign in with Google
                </button>
              </div>
            ) : (
              <button className={styles.signOutBtn} onClick={auth.signOut}>
                Sign Out
              </button>
            )}
         </div>

       </div>
    </div>
  );
}
