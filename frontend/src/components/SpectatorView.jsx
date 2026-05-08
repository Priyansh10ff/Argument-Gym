import React, { useEffect } from 'react';
import styles from './SpectatorView.module.css';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function SpectatorView({ roomId, onBack }) {
  const room = useQuery(api.rooms.getRoom, { roomId });
  const messages = useQuery(api.rooms.getMessages, { roomId }) || [];
  const analyses = useQuery(api.rooms.getAnalyses, { roomId }) || [];
  const addSpectator = useMutation(api.rooms.addSpectator);
  const removeSpectator = useMutation(api.rooms.removeSpectator);

  useEffect(() => {
    // Use stable roomId ref so cleanup always fires with correct value
    const rid = roomId;
    addSpectator({ roomId: rid });
    return () => {
      removeSpectator({ roomId: rid }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const last = analyses[analyses.length - 1];

  if (!room) {
    return (
      <div className={styles.wrap}>
        <div className={styles.noise} />
        <div className={styles.center}>
          <p className={styles.loadingText}>Loading room…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Left: debate feed */}
      <div className={styles.arena}>
        <div className={styles.arenaHeader}>
          <span className={styles.spectBadge}>👁 SPECTATING</span>
          <span className={styles.arenaTopicChip}>{room.topic}</span>
          <div className={styles.arenaPlayers}>
            {room.playerNames.map((name, i) => (
              <span key={i} className={styles.playerTag}>
                {name} · {room.playerStances[i]?.toUpperCase()}
              </span>
            ))}
          </div>
          {room.spectatorCount > 0 && (
            <span className={styles.spectCount}>👁 {room.spectatorCount} watching</span>
          )}
        </div>

        <div className={styles.feed}>
          {messages.map((msg, i) => (
            <div key={i} className={styles.msgBlock}>
              <div className={styles.msgLabel}>
                {msg.playerName}
              </div>
              <div className={`${styles.bubble} ${msg.playerIndex === 1 ? styles.p1Bubble : styles.p2Bubble}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {room.status === 'finished' && (
            <div className={styles.finishedBanner}>DEBATE FINISHED</div>
          )}
        </div>

        <div className={styles.spectatorBar}>
          <span className={styles.spectLabel}>You are spectating this debate</span>
          <button className={styles.backBtn} onClick={onBack}>← LEAVE</button>
        </div>
      </div>

      {/* Right: AI monitor */}
      <div className={styles.monitor}>
        <p className={styles.monitorBadge}>AI MONITOR</p>
        <p className={styles.monitorSub}>Live scoring after each exchange</p>

        {analyses.length === 0 && (
          <p className={styles.monitorEmpty}>
            Scores appear after both players have sent a message.
          </p>
        )}

        {last && (
          <div className={styles.latestBox}>
            <p className={styles.roundTag}>ROUND {last.round}</p>
            {room.playerNames.map((name, i) => {
              const key = i === 0 ? 'player1' : 'player2';
              const pd = last[key];
              return (
                <div key={i} className={styles.playerScoreRow}>
                  <div className={styles.psTop}>
                    <span className={styles.psName}>{name}</span>
                    <div className={styles.psScores}>
                      <span>L:{pd?.logic ?? '–'}</span>
                      <span>E:{pd?.evidence ?? '–'}</span>
                      <span>O:{pd?.originality ?? '–'}</span>
                    </div>
                  </div>
                  {pd?.feedback && <p className={styles.psFeedback}>{pd.feedback}</p>}
                </div>
              );
            })}
            {last.keyInsight && (
              <div className={styles.insight}>
                <span className={styles.insightLabel}>KEY INSIGHT</span>
                <p className={styles.insightText}>{last.keyInsight}</p>
              </div>
            )}
            <div className={styles.momentum}>
              <span className={styles.momentumLabel}>MOMENTUM</span>
              <span className={styles.momentumVal}>
                {last.momentum === 'neutral' ? '— EVEN'
                  : last.momentum === 'player1' ? `▶ ${room.playerNames[0] || 'P1'}`
                  : `▶ ${room.playerNames[1] || 'P2'}`}
              </span>
            </div>
          </div>
        )}

        {analyses.length > 1 && (
          <div className={styles.history}>
            <p className={styles.historyLabel}>ROUND HISTORY</p>
            {analyses.slice(0, -1).reverse().map((a, i) => (
              <div key={i} className={styles.historyRow}>
                <span className={styles.histRound}>R{a.round}</span>
                <span className={styles.histWinner}>
                  {a.roundWinner === 'tie' ? 'TIE'
                    : a.roundWinner === 'player1' ? (room.playerNames[0] || 'P1')
                    : (room.playerNames[1] || 'P2')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
