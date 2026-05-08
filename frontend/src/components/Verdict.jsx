import React, { useRef, useState } from 'react';
import styles from './Verdict.module.css';
import { SCORE_LABELS } from '../hooks/useGym';

function ScoreRing({ value, label, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className={styles.ring}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#2a2a2a" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14"
          fontFamily="'Bebas Neue', sans-serif">{value}</text>
      </svg>
      <span className={styles.ringLabel}>{label}</span>
    </div>
  );
}

export default function Verdict({ verdict, topic, stance, claims, eloResult, onRestart, mode }) {
  const labels = SCORE_LABELS[mode] || SCORE_LABELS.standard;
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const verdictColor = verdict.verdict === 'Won' ? '#4CAF50'
    : verdict.verdict === 'Lost' ? 'var(--red)' : 'var(--yellow)';
  const verdictMsg = verdict.verdict === 'Won' ? 'YOU WON'
    : verdict.verdict === 'Lost' ? 'YOU LOST' : 'DRAW';

  const handleCopy = () => {
    const claimLines = (verdict.claimResults || [])
      .map(cr => `  ${cr.survived ? '✓' : '✗'} ${cr.claim}`)
      .join('\n');
    const text = [
      '🥊 ARGUMENT GYM — DEBATE RESULT',
      '',
      `Topic: ${topic}`,
      `Stance: ${stance.toUpperCase()}`,
      `Mode: ${mode.toUpperCase()}`,
      `Verdict: ${verdictMsg}`,
      '',
      `${labels.logic}: ${verdict.scores?.logic ?? '–'}/100`,
      `${labels.evidence}: ${verdict.scores?.evidence ?? '–'}/100`,
      `${labels.originality}: ${verdict.scores?.originality ?? '–'}/100`,
      `Clarity: ${verdict.clarityScore ?? '–'}/100`,
      '',
      'CLAIMS:',
      claimLines,
      '',
      `"${verdict.overallFeedback}"`,
      '',
      `argumentgym.app`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>

        {/* Verdict banner */}
        <div className={styles.verdictBanner} style={{ borderColor: verdictColor }}>
          <span className={styles.verdictLabel} style={{ color: verdictColor }}>{verdictMsg}</span>
          <span className={styles.clarityScore}>{verdict.clarityScore ?? '–'}</span>
          <span className={styles.clarityLabel}>CLARITY SCORE</span>
        </div>

        {/* ELO delta */}
        {eloResult && (
          <div className={`${styles.eloDelta} ${eloResult.delta >= 0 ? styles.eloUp : styles.eloDown}`}>
            <span className={styles.eloIcon}>{eloResult.delta >= 0 ? '↑' : '↓'}</span>
            <span className={styles.eloChange}>
              {eloResult.delta >= 0 ? '+' : ''}{eloResult.delta} ELO
            </span>
            <span className={styles.eloNew}>
              New rating: <strong>{eloResult.newElo}</strong>
            </span>
            {(eloResult.newStreak || 0) > 1 && (
              <span className={styles.eloStreak}>🔥 {eloResult.newStreak} STREAK</span>
            )}
          </div>
        )}

        {/* Score rings */}
        <div className={styles.ringRow}>
          <ScoreRing value={verdict.scores?.logic ?? 0}       label={labels.logic}       color="var(--red)" />
          <ScoreRing value={verdict.scores?.evidence ?? 0}    label={labels.evidence}    color="#1D9E75" />
          <ScoreRing value={verdict.scores?.originality ?? 0} label={labels.originality} color="var(--yellow)" />
          {verdict.scores?.perspective != null && (
            <ScoreRing value={verdict.scores.perspective} label="PERSPECTIVE" color="#7F77DD" />
          )}
        </div>

        {/* Judge's assessment */}
        <div className={styles.feedback}>
          <p className={styles.feedbackLabel}>JUDGE'S ASSESSMENT</p>
          <p className={styles.feedbackText}>"{verdict.overallFeedback}"</p>
        </div>

        {/* Claim results */}
        {verdict.claimResults?.length > 0 && (
          <div className={styles.claimsSection}>
            <p className={styles.sectionLabel}>CLAIM RESULTS</p>
            {verdict.claimResults.map((cr, i) => (
              <div key={i} className={`${styles.claimResult} ${cr.survived ? styles.survived : styles.fell}`}>
                <div className={styles.claimResultHeader}>
                  <span className={styles.claimResultIcon}>{cr.survived ? '✓' : '✗'}</span>
                  <span className={styles.claimResultStatus}>{cr.survived ? 'SURVIVED' : 'COLLAPSED'}</span>
                </div>
                <p className={styles.claimResultText}>{cr.claim}</p>
                <p className={styles.claimResultNote}>{cr.note}</p>
              </div>
            ))}
          </div>
        )}

        {/* Strengths & weaknesses */}
        <div className={styles.swGrid}>
          <div className={styles.swCard}>
            <p className={styles.swTitle}>STRENGTHS</p>
            {(verdict.strengths || []).map((s, i) => (
              <div key={i} className={`${styles.swItem} ${styles.strength}`}>
                <span className={styles.swIcon}>+</span><span>{s}</span>
              </div>
            ))}
          </div>
          <div className={styles.swCard}>
            <p className={styles.swTitle}>WEAKNESSES</p>
            {(verdict.weaknesses || []).map((w, i) => (
              <div key={i} className={`${styles.swItem} ${styles.weakness}`}>
                <span className={styles.swIcon}>−</span><span>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓ COPIED' : 'COPY SCORE CARD'}
          </button>
          <button className={styles.resetBtn} onClick={onRestart}>FIGHT AGAIN →</button>
        </div>

      </div>
    </div>
  );
}
