import React from 'react';
import styles from './Profile.module.css';
import { useAuth } from '../lib/auth';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Profile({ onBack }) {
  const auth = useAuth();
  
  const currentUser = auth.user;
  const userStats = useQuery(api.users.getUserStats, currentUser?._id ? { userId: currentUser._id } : "skip");
  const weaknessProfile = useQuery(api.weaknessProfiles.get, currentUser?._id ? { userId: currentUser._id } : "skip");

  // If auth is still initializing, show loading
  if (auth.loading) {
    return (
      <div className={styles.wrap}>
         <div className={styles.loading}>Initializing session...</div>
      </div>
    );
  }

  // If we have a user but stats are still fetching
  if (currentUser && userStats === undefined) {
    return (
      <div className={styles.wrap}>
         <div className={styles.loading}>Loading player stats...</div>
      </div>
    );
  }

  // Final fallback if no user found after loading
  if (!currentUser) {
    return (
      <div className={styles.wrap}>
         <div className={styles.inner}>
           <button className={styles.backBtn} onClick={onBack}>← BACK</button>
           <div className={styles.loading}>No profile found. Try debating once to initialize!</div>
         </div>
      </div>
    );
  }

  // At this point we have currentUser and (userStats or userStats === null)
  const history = userStats?.history || [];
  const rank = userStats?.rank || 0;
  const wp = weaknessProfile;

  const BADGES = {
    "Flawless Victory": { icon: "🏅", desc: "Win a debate with 10/10 Logic score" },
    "Unstoppable": { icon: "🔥", desc: "Reach a 10-win streak" },
    "Veteran": { icon: "🛡️", desc: "Complete 10 debates" },
  };
  const achievements = currentUser.achievements || [];

  const parseJSON = (str, fallback) => {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch {
      return fallback;
    }
  };

  const commonW = wp ? parseJSON(wp.commonWeaknesses, []) : [];
  const fallacyH = wp ? parseJSON(wp.fallacyHits, {}) : {};

  const handleCopyReplay = (id) => {
    const url = `${window.location.origin}/?replay=${id}`;
    navigator.clipboard.writeText(url).then(() => alert('Replay link copied!'));
  };

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

         {/* Streak banner — shown when streak > 1 */}
         {(currentUser.streak > 1) && (
           <div className={styles.streakBanner}>
             <span className={styles.streakFire}>🔥</span>
             <div>
               <p className={styles.streakTitle}>{currentUser.streak}-WIN STREAK</p>
               <p className={styles.streakSub}>Personal best: {currentUser.bestStreak} wins in a row</p>
             </div>
           </div>
         )}

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

            {/* Achievements Card */}
            <div className={`${styles.card} ${styles.fullWidth}`}>
               <h2 className={styles.cardTitle}>ACHIEVEMENTS</h2>
               <div className={styles.achievementsGrid}>
                 {Object.entries(BADGES).map(([key, info]) => {
                   const unlocked = achievements.includes(key);
                   return (
                     <div key={key} className={`${styles.badgeItem} ${unlocked ? styles.badgeUnlocked : styles.badgeLocked}`}>
                       <div className={styles.badgeIcon}>{info.icon}</div>
                       <div className={styles.badgeInfo}>
                         <div className={styles.badgeName}>{key}</div>
                         <div className={styles.badgeDesc}>{info.desc}</div>
                       </div>
                     </div>
                   );
                 })}
               </div>
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
                         <button className={styles.copyLinkBtn} onClick={() => handleCopyReplay(match._id)}>🔗 Share</button>
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
