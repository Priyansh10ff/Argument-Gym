import React, { useEffect, useRef } from 'react';
import styles from './Sparring.module.css';

function ScoreBar({ label, value, color }) {
  return (
    <div className={styles.scoreRow}>
      <span className={styles.scoreLabel}>{label}</span>
      <div className={styles.barBg}>
        <div className={styles.barFill} style={{ width: `${value}%`, background: color }} />
      </div>
      <span className={styles.scoreVal}>{value}</span>
    </div>
  );
}

export default function Sparring({
  topic, stance, difficulty, claims, rounds, currentRound,
  userInput, setUserInput, loading, error, runningScores,
  MAX_ROUNDS, onSubmit, onEndEarly, sideSwitch
}) {
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!loading) inputRef.current?.focus();
  }, [rounds, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit();
  };

  const lastRound = rounds[rounds.length - 1];

  return (
    <div className={styles.wrap}>
      <div className={styles.sidebar}>
        <div className={styles.sideTop}>
          <div className={styles.topicChip}>{topic}</div>
          <div className={styles.metaRow}>
            <span className={styles.metaBadge}>{stance.toUpperCase()}</span>
            <span className={`${styles.metaBadge} ${difficulty === 'brutal' ? styles.redBadge : ''}`}>{difficulty.toUpperCase()}</span>
            {sideSwitch && <span className={styles.switchBadge}>SWITCHED</span>}
          </div>
          <div className={styles.roundDisplay}>
            <span className={styles.roundNum}>{currentRound}</span>
            <span className={styles.roundOf}>/ {MAX_ROUNDS}</span>
            <span className={styles.roundLabel}>ROUNDS</span>
          </div>
        </div>

        <div className={styles.scores}>
          <p className={styles.scoresTitle}>LIVE SCORES</p>
          <ScoreBar label="LOGIC" value={runningScores.logic} color="#7F77DD" />
          <ScoreBar label="EVIDENCE" value={runningScores.evidence} color="#1D9E75" />
          <ScoreBar label="ORIGINALITY" value={runningScores.originality} color="#D85A30" />
        </div>

        <div className={styles.claims}>
          <p className={styles.claimsTitle}>YOUR CLAIMS</p>
          {claims.map((c, i) => (
            <div key={i} className={styles.claimItem}>
              <span className={styles.claimNum}>{i + 1}</span>
              <span className={styles.claimText}>{c}</span>
            </div>
          ))}
        </div>

        {currentRound >= 2 && (
          <button className={styles.endBtn} onClick={onEndEarly}>GET VERDICT NOW</button>
        )}
      </div>

      <div className={styles.arena}>
        <div className={styles.feed}>
          {rounds.map((r, i) => (
            <div key={i} className={styles.roundBlock}>
              <div className={styles.roundTag}>ROUND {r.round}</div>

              <div className={styles.bubble + ' ' + styles.userBubble}>
                <div className={styles.bubbleLabel}>YOU</div>
                <p className={styles.bubbleText}>{r.userArg}</p>
              </div>

              {r.scores?.roundFeedback && (
                <div className={styles.roundMicro}>
                  <span className={styles.microScores}>
                    L:{r.scores.logic} · E:{r.scores.evidence} · O:{r.scores.originality}
                  </span>
                  <span className={styles.microFeedback}>{r.scores.roundFeedback}</span>
                </div>
              )}

              <div className={styles.bubble + ' ' + styles.aiBubble}>
                <div className={styles.bubbleLabel + ' ' + styles.aiLabel}>GYM AI</div>
                <p className={styles.bubbleText}>{r.aiArg}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className={styles.thinking}>
              <span className={styles.thinkDot} />
              <span className={styles.thinkDot} />
              <span className={styles.thinkDot} />
              <span className={styles.thinkLabel}>AI is formulating counter-argument...</span>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          {lastRound && <p className={styles.inputHint}>Respond to: <em>{lastRound.aiArg?.split('?')[0]?.slice(-80)}?</em></p>}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.textarea}
              placeholder="Defend your position... (Ctrl+Enter to submit)"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKey}
              rows={3}
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={onSubmit} disabled={!userInput.trim() || loading}>
              {loading ? '...' : '→'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
