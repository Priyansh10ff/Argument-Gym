import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import styles from './Replay.module.css';

export default function Replay({ debateId, onBack }) {
  const debate = useQuery(api.debates.getReplay, { debateId });

  if (debate === undefined) return <div className={styles.loading}>Loading replay...</div>;
  if (debate === null) return <div className={styles.error}>Replay not found.</div>;

  return (
    <div className={styles.wrap}>
       <div className={styles.noise} />
       <div className={styles.inner}>
         <button className={styles.backBtn} onClick={onBack}>← BACK TO GYM</button>
         
         <div className={styles.header}>
           <h1 className={styles.title}>MATCH REPLAY</h1>
           <div className={styles.meta}>
             <span className={styles.topic}>{debate.topic}</span>
             <span className={styles.mode}>{debate.mode}</span>
             <span className={styles.date}>{debate.date}</span>
           </div>
         </div>

         <div className={styles.verdictCard}>
           <h2 className={styles.verdictTitle}>VERDICT: <span className={`${styles.verdictResult} ${styles['verdict' + debate.verdict]}`}>{debate.verdict}</span></h2>
           <div className={styles.scores}>
             <span>Logic: {debate.logicScore}/10</span>
             <span>Evidence: {debate.evidenceScore}/10</span>
             <span>Originality: {debate.originalityScore}/10</span>
           </div>
         </div>

         <div className={styles.transcript}>
           <h2 className={styles.transcriptTitle}>DEBATE TRANSCRIPT</h2>
           {debate.transcript ? (
             debate.transcript.map((msg, idx) => (
               <div key={idx} className={`${styles.message} ${msg.role === 'user' ? styles.msgUser : styles.msgAi}`}>
                 <div className={styles.msgAvatar}>{msg.role === 'user' ? '👤' : '🤖'}</div>
                 <div className={styles.msgContent}>
                   <div className={styles.msgName}>{msg.role === 'user' ? debate.userName : 'AI Opponent'}</div>
                   <div className={styles.msgText}>{msg.content}</div>
                 </div>
               </div>
             ))
           ) : (
             <div className={styles.noTranscript}>No transcript available for this legacy debate.</div>
           )}
         </div>
       </div>
    </div>
  );
}
