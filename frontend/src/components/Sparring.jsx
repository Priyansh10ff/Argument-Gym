import React, { useEffect, useRef } from 'react';
import styles from './Sparring.module.css';
import HealthBar from './HealthBar';
import { SCORE_LABELS, AI_LABEL } from '../hooks/useGym';

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
  topic, stance, difficulty, claims, claimsHp, MAX_CLAIM_HP,
  rounds, currentRound, userInput, setUserInput,
  loading, error, runningScores, MAX_ROUNDS,
  onSubmit, onEndEarly, sideSwitch, mode,
  streamingText
}) {
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const labels    = SCORE_LABELS[mode] || SCORE_LABELS.standard;
  const aiLabel   = AI_LABEL[mode] || 'GYM AI';
  const allBroken = claimsHp && claimsHp.every(hp => hp === 0);

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
            <span className={`${styles.metaBadge} ${difficulty === 'brutal' ? styles.redBadge : ''}`}>
              {difficulty.toUpperCase()}
            </span>
            {mode !== 'standard' && (
              <span className={styles.modeBadge}>
                {mode === 'courtroom' ? '⚖️ COURT' : '💼 SALES'}
              </span>
            )}
            {sideSwitch && <span className={styles.switchBadge}>SWITCHED</span>}
          </div>
          <div className={styles.roundDisplay}>
            <span className={styles.roundNum}>{currentRound}</span>
            <span className={styles.roundOf}>/ {MAX_ROUNDS}</span>
            <span className={styles.roundLabel}>ROUNDS</span>
          </div>
        </div>

        {claims.length > 0 && (
          <HealthBar claims={claims} claimsHp={claimsHp} maxHp={MAX_CLAIM_HP} />
        )}

        {allBroken && (
          <div className={styles.allBrokenAlert}>
            ⚠ ALL CLAIMS COLLAPSED — VERDICT INCOMING
          </div>
        )}

        <div className={styles.scores}>
          <p className={styles.scoresTitle}>LIVE SCORES</p>
          <ScoreBar label={labels.logic}       value={runningScores.logic}       color="var(--red)" />
          <ScoreBar label={labels.evidence}    value={runningScores.evidence}    color="#1D9E75" />
          <ScoreBar label={labels.originality} value={runningScores.originality} color="var(--yellow)" />
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

              <div className={`${styles.bubble} ${styles.userBubble}`}>
                <div className={styles.bubbleLabel}>YOU</div>
                <p className={styles.bubbleText}>{r.userArg}</p>
              </div>

              {r.scores?.roundFeedback && (
                <div className={styles.roundMicro}>
                  <span className={styles.microScores}>
                    L:{r.scores.logic} · E:{r.scores.evidence} · O:{r.scores.originality}
                  </span>
                  {r.claimHits?.some(Boolean) && (
                    <span className={styles.hitTag}>
                      CLAIM {r.claimHits.map((h,j) => h ? j+1 : null).filter(Boolean).join(',')} HIT
                    </span>
                  )}
                  <span className={styles.microFeedback}>{r.scores.roundFeedback}</span>
                </div>
              )}

              {/* Judge ruling — Court Gym only */}
              {r.judgeRuling && mode === 'courtroom' && (
                <div className={styles.judgeBlock}>
                  <span className={styles.judgeTag}>JUDGE</span>
                  <span className={`${styles.judgeRuling} ${styles[`ruling_${r.judgeRuling.ruling}`]}`}>
                    {(r.judgeRuling.ruling || '').toUpperCase()}
                  </span>
                  <span className={styles.judgeComment}>{r.judgeRuling.comment}</span>
                </div>
              )}

              <div className={`${styles.bubble} ${styles.aiBubble}`}>
                <div className={`${styles.bubbleLabel} ${styles.aiLabel}`}>{aiLabel}</div>
                <p className={styles.bubbleText}>{r.aiArg}</p>
              </div>
            </div>
          ))}

          {loading && streamingText && (
            <div className={`${styles.bubble} ${styles.aiBubble}`}>
              <div className={`${styles.bubbleLabel} ${styles.aiLabel}`}>{aiLabel}</div>
              <p className={styles.bubbleText}>
                {streamingText.replace(/\|\|\|[A-Z_]+\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, '').replace(/^COUNSEL:\s*/i, '').trim()}
                <span className={styles.streamCursor}>▊</span>
              </p>
            </div>
          )}

          {loading && !streamingText && (
            <div className={styles.thinking}>
              <span className={styles.thinkDot} />
              <span className={styles.thinkDot} />
              <span className={styles.thinkDot} />
              <span className={styles.thinkLabel}>
                {aiLabel === 'COUNSEL' ? 'Counsel is preparing cross-examination...' :
                 aiLabel === 'BUYER'   ? 'Buyer is raising objections...' :
                 'AI is formulating counter-argument...'}
              </span>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          {lastRound && (
            <p className={styles.inputHint}>
              Respond to: <em>{lastRound.aiArg?.split('?')[0]?.slice(-80)}?</em>
            </p>
          )}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.textarea}
              placeholder="Defend your position... (Ctrl+Enter to submit)"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKey}
              rows={3}
              disabled={loading || allBroken}
            />
            <button
              className={styles.sendBtn}
              onClick={onSubmit}
              disabled={!userInput.trim() || loading || allBroken}
            >
              {loading ? '…' : '→'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
