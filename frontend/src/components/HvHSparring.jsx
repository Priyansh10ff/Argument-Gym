import React, { useState, useEffect, useRef } from 'react';
import styles from './HvHSparring.module.css';
import { io } from 'socket.io-client';
import { getUserId } from '../lib/identity';

export default function HvHSparring({ roomId, userId, name, onBack }) {
  const [status, setStatus]         = useState('connecting');
  const [topic, setTopic]           = useState('');
  const [players, setPlayers]       = useState([]);
  const [messages, setMessages]     = useState([]);
  const [analyses, setAnalyses]     = useState([]);
  const [finalVerdict, setVerdict]  = useState(null);
  const [input, setInput]           = useState('');
  const [error, setError]           = useState('');
  const socketRef  = useRef(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const myId = userId || getUserId();

  useEffect(() => {
    // Connect to same origin — Vite proxies /socket.io in dev
    const sock = io({ transports: ['websocket', 'polling'] });
    socketRef.current = sock;

    sock.on('connect', () => sock.emit('hvh:join', { roomId, userId: myId, name }));

    sock.on('hvh:joined', ({ topic, status, players }) => {
      setTopic(topic);
      setPlayers(players);
      setStatus(status === 'active' ? 'active' : 'waiting');
    });
    sock.on('hvh:start', ({ topic, players }) => {
      setTopic(topic); setPlayers(players); setStatus('active');
    });
    sock.on('hvh:message',     msg => setMessages(p => [...p, msg]));
    sock.on('hvh:ai_analysis', a   => setAnalyses(p  => [...p, a]));
    sock.on('hvh:final_verdict', ({ verdict, players }) => {
      setVerdict({ verdict, players }); setStatus('finished');
    });
    sock.on('hvh:player_left', ({ userId: lid }) => {
      if (lid !== myId) setError('Opponent disconnected.');
    });
    sock.on('hvh:error', ({ message }) => setError(message));

    return () => sock.disconnect();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (status === 'active') inputRef.current?.focus();
  }, [messages, status]);

  const myPlayer  = players.find(p => p.id === myId);
  const send = () => {
    if (!input.trim() || !socketRef.current || status !== 'active') return;
    socketRef.current.emit('hvh:message', { roomId, userId: myId, text: input.trim() });
    setInput('');
  };
  const requestVerdict = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('hvh:verdict', { roomId });
    setStatus('verdict_loading');
  };

  const last = analyses[analyses.length - 1];

  // ── Finished ──
  if (status === 'finished' && finalVerdict) {
    const { verdict, players: vp } = finalVerdict;
    const myIdx = vp.findIndex(p => p.id === myId);
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
              const isMe = p.id === myId;
              return (
                <div key={p.id} className={`${styles.vCard} ${isMe ? styles.vCardMe : ''}`}>
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
  if (status === 'connecting' || status === 'waiting') {
    return (
      <div className={styles.waitWrap}>
        <div className={styles.noise} />
        <div className={styles.waitInner}>
          <div className={styles.waitTitle}>
            {status === 'connecting' ? 'CONNECTING…' : 'WAITING FOR OPPONENT'}
          </div>
          <div className={styles.codeBox}>
            <p className={styles.codeBoxLabel}>ROOM CODE</p>
            <p className={styles.codeBoxCode}>{roomId}</p>
          </div>
          {topic && <p className={styles.waitTopic}>Topic: <strong>{topic}</strong></p>}
          {error  && <p className={styles.error}>{error}</p>}
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
          <span className={styles.arenaTopicChip}>{topic}</span>
          <div className={styles.arenaPlayers}>
            {players.map(p => (
              <span key={p.id} className={`${styles.playerTag} ${p.id === myId ? styles.myTag : ''}`}>
                {p.name} · {p.stance?.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.feed}>
          {messages.map((msg, i) => {
            const isMe = msg.playerId === myId;
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

          {status === 'verdict_loading' && (
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
              placeholder={`Argue ${myPlayer?.stance || 'your side'}… (Ctrl+Enter to send)`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && send()}
              rows={2}
              disabled={status !== 'active'}
            />
            <button className={styles.sendBtn} onClick={send} disabled={!input.trim() || status !== 'active'}>→</button>
          </div>
          {messages.length >= 4 && (
            <button className={styles.verdictBtn} onClick={requestVerdict} disabled={status !== 'active'}>
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
            {players.map((p, i) => {
              const key = i === 0 ? 'player1' : 'player2';
              const pd  = last[key];
              const isMe = p.id === myId;
              return (
                <div key={p.id} className={`${styles.playerScoreRow} ${isMe ? styles.mineRow : ''}`}>
                  <div className={styles.psTop}>
                    <span className={styles.psName}>{p.name}{isMe ? ' (YOU)' : ''}</span>
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
                  : last.momentum === 'player1' ? `▶ ${players[0]?.name || 'P1'}`
                  : `▶ ${players[1]?.name || 'P2'}`}
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
                    : a.roundWinner === 'player1' ? (players[0]?.name || 'P1')
                    : (players[1]?.name || 'P2')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
