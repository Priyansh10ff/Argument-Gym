import React, { useState, useEffect, useRef } from 'react';
import styles from './HvHSparring.module.css';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function HvHSparring({ roomId, roomCode, userId, name, onBack }) {
  const [input, setInput]       = useState('');
  const [error, setError]       = useState('');
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [finalVerdict, setFinalVerdict]     = useState(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const lastMsgCount = useRef(0);

  // Reactive queries — auto-update in real time (replaces Socket.IO)
  const room = useQuery(api.rooms.getRoom, { roomId });
  const messages = useQuery(api.rooms.getMessages, { roomId }) || [];
  const analyses = useQuery(api.rooms.getAnalyses, { roomId }) || [];

  // Mutations & actions
  const addMessage = useMutation(api.rooms.addMessage);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const updateStatus = useMutation(api.rooms.updateStatus);
  const addAnalysis = useMutation(api.rooms.addAnalysis);
  const monitorHvH = useAction(api.llm.monitorHvH);
  const hvhVerdictAction = useAction(api.llm.hvhVerdict);

  // Join room on mount
  useEffect(() => {
    if (roomCode) {
      joinRoom({ roomCode, playerId: userId, playerName: name }).catch(() => {});
    }
  }, [roomCode]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (room?.status === 'active') inputRef.current?.focus();
  }, [messages, room?.status]);

  // Trigger AI monitor after every 2 messages
  useEffect(() => {
    if (messages.length >= 2 && messages.length % 2 === 0 && messages.length > lastMsgCount.current) {
      lastMsgCount.current = messages.length;
      const last2 = messages.slice(-2);
      const p1msg = last2.find(m => m.playerIndex === 1);
      const p2msg = last2.find(m => m.playerIndex === 2);
      if (p1msg && p2msg && room) {
        monitorHvH({
          topic: room.topic,
          player1Name: room.playerNames[0] || 'P1',
          player2Name: room.playerNames[1] || 'P2',
          p1Text: p1msg.text,
          p2Text: p2msg.text,
        }).then(scores => {
          if (scores) {
            addAnalysis({
              roomId,
              round: Math.floor(messages.length / 2),
              player1: scores.player1 || { logic: 5, evidence: 5, originality: 5, feedback: '' },
              player2: scores.player2 || { logic: 5, evidence: 5, originality: 5, feedback: '' },
              roundWinner: scores.roundWinner || 'tie',
              momentum: scores.momentum || 'neutral',
              keyInsight: scores.keyInsight || '',
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }
  }, [messages.length]);

  const myPlayer = room?.playerIds?.indexOf(userId);
  const myPlayerIndex = myPlayer !== undefined && myPlayer !== -1 ? myPlayer + 1 : 0;
  const status = room?.status || 'waiting';

  const send = async () => {
    if (!input.trim() || status !== 'active' || myPlayerIndex === 0) return;
    try {
      await addMessage({
        roomId,
        playerId: userId,
        playerName: name,
        playerIndex: myPlayerIndex,
        text: input.trim(),
      });
      setInput('');
    } catch (e) {
      setError('Failed to send message.');
    }
  };

  const requestVerdict = async () => {
    if (!room) return;
    setVerdictLoading(true);
    try {
      await updateStatus({ roomId, status: 'finished' });
      const transcript = messages.map(m => `${m.playerName} (P${m.playerIndex}): ${m.text}`).join('\n\n');
      const verdict = await hvhVerdictAction({
        topic: room.topic,
        player1Name: room.playerNames[0] || 'P1',
        player2Name: room.playerNames[1] || 'P2',
        transcript,
      });
      setFinalVerdict({ verdict, players: room.playerNames.map((n, i) => ({ id: room.playerIds[i], name: n, stance: room.playerStances[i] })) });
    } catch (e) {
      setError('Failed to generate verdict.');
    }
    setVerdictLoading(false);
  };

  const last = analyses[analyses.length - 1];

  // ── Finished ──
  if ((status === 'finished' || finalVerdict) && finalVerdict) {
    const { verdict, players: vp } = finalVerdict;
    const myIdx = vp.findIndex(p => p.id === userId);
    const myKey = myIdx === 0 ? 'player1' : 'player2';
    const win = verdict.winner === myKey;
    const draw = verdict.winner === 'draw';
    return (
      <div className={styles.verdictWrap}>
        <div className={styles.noise} />
        <div className={styles.verdictInner}>
          <div className={`${styles.verdictBanner} ${win ? styles.vWon : draw ? styles.vDraw : styles.vLost}`}>
            {win ? 'YOU WON' : draw ? 'DRAW' : 'YOU LOST'}
          </div>
          <div className={styles.vAnalysis}>
            <p className={styles.vLabel}>AI ANALYSIS</p>
            <p className={styles.vText}>"{verdict.overallAnalysis}"</p>
          </div>
          <div className={styles.vPlayers}>
            {vp.map((p, i) => {
              const key = i === 0 ? 'player1' : 'player2';
              const pd  = verdict[key];
              const isMe = p.id === userId;
              return (
                <div key={i} className={`${styles.vCard} ${isMe ? styles.vCardMe : ''}`}>
                  <p className={styles.vPlayerName}>{p.name}{isMe ? ' (YOU)' : ''}</p>
                  <p className={styles.vScore}>{pd?.totalScore ?? 0}<span>/100</span></p>
                  {pd?.strengths?.map((s,j) => <p key={j} className={styles.vStrength}>+ {s}</p>)}
                  {pd?.weaknesses?.map((w,j) => <p key={j} className={styles.vWeakness}>− {w}</p>)}
                </div>
              );
            })}
          </div>
          {verdict.bestArgument && (
            <div className={styles.vBest}>
              <p className={styles.vLabel}>BEST ARGUMENT</p>
              <p className={styles.vText}>"{verdict.bestArgument}"</p>
            </div>
          )}
          <button className={styles.backBtn} onClick={onBack}>← BACK TO GYM</button>
        </div>
      </div>
    );
  }

  // ── Waiting / Connecting ──
  if (status === 'waiting' || !room) {
    return (
      <div className={styles.waitWrap}>
        <div className={styles.noise} />
        <div className={styles.waitInner}>
          <div className={styles.waitTitle}>
            {!room ? 'CONNECTING…' : 'WAITING FOR OPPONENT'}
          </div>
          <div className={styles.codeBox}>
            <p className={styles.codeBoxLabel}>ROOM CODE</p>
            <p className={styles.codeBoxCode}>{roomCode}</p>
          </div>
          {room?.topic && <p className={styles.waitTopic}>Topic: <strong>{room.topic}</strong></p>}
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.waitDots}>
            {[0,1,2].map(i => <span key={i} style={{ animationDelay:`${i*0.2}s` }} />)}
          </div>
          <button className={styles.backBtn} onClick={onBack}>← CANCEL</button>
        </div>
      </div>
    );
  }

  // ── Active debate ──
  return (
    <div className={styles.wrap}>
      {/* Left: debate feed */}
      <div className={styles.arena}>
        <div className={styles.arenaHeader}>
          <span className={styles.arenaTopicChip}>{room.topic}</span>
          <div className={styles.arenaPlayers}>
            {room.playerNames.map((n, i) => (
              <span key={i} className={`${styles.playerTag} ${room.playerIds[i] === userId ? styles.myTag : ''}`}>
                {n} · {room.playerStances[i]?.toUpperCase()}
              </span>
            ))}
          </div>
          {room.spectatorCount > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--yellow)' }}>
              👁 {room.spectatorCount}
            </span>
          )}
        </div>

        <div className={styles.feed}>
          {messages.map((msg, i) => {
            const isMe = msg.playerId === userId;
            return (
              <div key={i} className={styles.msgBlock}>
                <div className={`${styles.msgLabel} ${isMe ? styles.myMsgLabel : ''}`}>
                  {msg.playerName}
                </div>
                <div className={`${styles.bubble} ${isMe ? styles.myBubble : styles.oppBubble}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {verdictLoading && (
            <div className={styles.thinking}>
              <span className={styles.thinkDot} /><span className={styles.thinkDot} /><span className={styles.thinkDot} />
              <span className={styles.thinkLabel}>AI IS CALCULATING VERDICT…</span>
            </div>
          )}
          {error && <div className={styles.errBox}>{error}</div>}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.textarea}
              placeholder={`Argue ${room.playerStances[myPlayer] || 'your side'}… (Ctrl+Enter to send)`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && send()}
              rows={2}
              disabled={status !== 'active' || myPlayerIndex === 0}
            />
            <button className={styles.sendBtn} onClick={send} disabled={!input.trim() || status !== 'active'}>→</button>
          </div>
          {messages.length >= 4 && (
            <button className={styles.verdictBtn} onClick={requestVerdict} disabled={status !== 'active' || verdictLoading}>
              REQUEST FINAL VERDICT
            </button>
          )}
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
            {room.playerNames.map((pName, i) => {
              const key = i === 0 ? 'player1' : 'player2';
              const pd  = last[key];
              const isMe = room.playerIds[i] === userId;
              return (
                <div key={i} className={`${styles.playerScoreRow} ${isMe ? styles.mineRow : ''}`}>
                  <div className={styles.psTop}>
                    <span className={styles.psName}>{pName}{isMe ? ' (YOU)' : ''}</span>
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
            {analyses.slice(0,-1).reverse().map((a,i) => (
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
