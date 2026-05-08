import React, { useState, useEffect } from 'react';
import { useGym, PHASES } from './hooks/useGym';
import MarketingPage  from './components/MarketingPage';
import Landing        from './components/Landing';
import Statement      from './components/Statement';
import Loader         from './components/Loader';
import ClaimsConfirm  from './components/ClaimsConfirm';
import Sparring       from './components/Sparring';
import SideSwitchOffer from './components/SideSwitchOffer';
import Verdict        from './components/Verdict';
import HvHLobby       from './components/HvHLobby';
import HvHSparring    from './components/HvHSparring';
import PublicLobby    from './components/PublicLobby';
import SpectatorView  from './components/SpectatorView';
import Profile        from './components/Profile';
import Replay         from './components/Replay';
import NavBar         from './components/NavBar';
import { getUserName } from './lib/identity';

export default function App() {
  const gym = useGym();
  const [showMarketing, setShowMarketing] = useState(true);
  const [hvhMode,     setHvhMode]     = useState(null);   // null | 'lobby' | 'room'
  const [hvhData,     setHvhData]     = useState(null);
  const [lobbyMode,   setLobbyMode]   = useState(false);
  const [profileMode, setProfileMode] = useState(false);
  const [spectating,  setSpectating]  = useState(null);
  const [replayId,    setReplayId]    = useState(null);

  // Handle ?join=XXXX or ?replay=XXXX on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    const repId    = params.get('replay');

    if (repId) {
      setShowMarketing(false);
      setReplayId(repId);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (joinCode && joinCode.length === 8) {
      setShowMarketing(false);
      setHvhMode('room');
      setHvhData({
        roomCode: joinCode.toUpperCase(),
        userId: localStorage.getItem('arg_gym_uid') || crypto.randomUUID(),
        name: getUserName() || 'Anonymous',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Go home from anywhere ──────────────────────────────────────────────────
  const goHome = () => {
    setShowMarketing(false);
    setHvhMode(null); setHvhData(null);
    setLobbyMode(false); setProfileMode(false);
    setSpectating(null); setReplayId(null);
    gym.reset();
  };

  // ── Marketing ──────────────────────────────────────────────────────────────
  if (showMarketing && gym.phase === PHASES.LANDING && !hvhMode && !lobbyMode && !profileMode && !spectating && !replayId) {
    return <MarketingPage onEnter={() => setShowMarketing(false)} />;
  }

  // ── Shared nav props ───────────────────────────────────────────────────────
  const navProps = {
    onHome: goHome,
    onLobby: () => { setLobbyMode(true); setHvhMode(null); setSpectating(null); setProfileMode(false); setReplayId(null); },
    onProfile: () => { setProfileMode(true); setLobbyMode(false); setHvhMode(null); setSpectating(null); setReplayId(null); },
  };

  // ── Replay ─────────────────────────────────────────────────────────────────
  if (replayId) {
    return (
      <>
        <NavBar {...navProps} />
        <Replay debateId={replayId} onBack={() => setReplayId(null)} />
      </>
    );
  }

  // ── Public Lobby ───────────────────────────────────────────────────────────
  if (lobbyMode) {
    return (
      <>
        <NavBar {...navProps} active="lobby" />
        <PublicLobby
          onBack={() => setLobbyMode(false)}
          onJoinRoom={(data) => { setLobbyMode(false); setHvhMode('room'); setHvhData(data); }}
          onSpectate={(data) => { setLobbyMode(false); setSpectating(data); }}
        />
      </>
    );
  }

  // ── Spectator ──────────────────────────────────────────────────────────────
  if (spectating) {
    return (
      <>
        <NavBar {...navProps} />
        <SpectatorView roomId={spectating.roomId} onBack={() => setSpectating(null)} />
      </>
    );
  }

  // ── HvH Lobby ─────────────────────────────────────────────────────────────
  if (hvhMode === 'lobby') {
    return (
      <>
        <NavBar {...navProps} />
        <HvHLobby
          onEnterRoom={(data) => { setHvhData(data); setHvhMode('room'); }}
          onBack={() => setHvhMode(null)}
        />
      </>
    );
  }

  // ── HvH Room ──────────────────────────────────────────────────────────────
  if (hvhMode === 'room' && hvhData) {
    return (
      <>
        <NavBar {...navProps} />
        <HvHSparring
          roomId={hvhData.roomId}
          roomCode={hvhData.roomCode}
          userId={hvhData.userId}
          name={hvhData.name}
          onBack={() => { setHvhMode(null); setHvhData(null); }}
        />
      </>
    );
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  if (profileMode) {
    return (
      <>
        <NavBar {...navProps} active="profile" />
        <Profile onBack={() => setProfileMode(false)} />
      </>
    );
  }

  // ── Single-player ──────────────────────────────────────────────────────────
  const handleStart = (opts) => {
    if (opts.mode === 'hvh')     { setHvhMode('lobby'); return; }
    if (opts.mode === 'lobby')   { setLobbyMode(true);  return; }
    if (opts.mode === 'profile') { setProfileMode(true); return; }
    gym.setMode(opts.mode || 'standard');
    gym.setModel(opts.model || 'auto');
    gym.setDifficulty(opts.difficulty || 'rigorous');
    gym.setStance(opts.stance || 'for');
    gym.setScenario(opts.scenario || '');
    gym.setPersona(opts.persona || 'skeptical_cfo');
    gym.startDebate(opts.topic);
  };

  const showNav = gym.phase !== PHASES.LANDING;

  return (
    <>
      {showNav && <NavBar {...navProps} />}
      {(() => {
        switch (gym.phase) {
          case PHASES.LANDING:
            return <Landing onStart={handleStart} />;
          case PHASES.STATEMENT:
            return (
              <Statement
                topic={gym.topic} stance={gym.stance} difficulty={gym.difficulty} mode={gym.mode}
                statement={gym.statement} setStatement={gym.setStatement}
                onSubmit={gym.submitStatement} onBack={gym.reset}
              />
            );
          case PHASES.EXTRACTING:
            return <Loader />;
          case PHASES.CLAIMS_CONFIRM:
            return (
              <ClaimsConfirm
                claims={gym.claims} summary={gym.claimSummary}
                onConfirm={gym.confirmClaims} onBack={gym.reset} mode={gym.mode}
              />
            );
          case PHASES.SPARRING:
          case PHASES.SIDE_SWITCHING:
            return (
              <Sparring
                topic={gym.topic} stance={gym.stance} difficulty={gym.difficulty}
                claims={gym.claims} claimsHp={gym.claimsHp} MAX_CLAIM_HP={gym.MAX_CLAIM_HP}
                rounds={gym.rounds} currentRound={gym.currentRound}
                userInput={gym.userInput} setUserInput={gym.setUserInput}
                loading={gym.loading} error={gym.error} runningScores={gym.runningScores}
                MAX_ROUNDS={gym.MAX_ROUNDS}
                onSubmit={gym.submitRound} onEndEarly={gym.endEarly}
                sideSwitch={gym.sideSwitch} mode={gym.mode}
                streamingText={gym.streamingText}
              />
            );
          case PHASES.SIDE_SWITCH_OFFER:
            return (
              <SideSwitchOffer
                topic={gym.topic} stance={gym.stance}
                onAccept={gym.acceptSideSwitch} onDecline={gym.declineSideSwitch}
              />
            );
          case PHASES.VERDICT_LOADING:
            return <Loader message="AI is generating final verdict..." />;
          case PHASES.VERDICT:
            return (
              <Verdict
                verdict={gym.verdict} topic={gym.topic} stance={gym.stance}
                claims={gym.claims} eloResult={gym.eloResult}
                onRestart={gym.reset} mode={gym.mode}
              />
            );
          default:
            return <Landing onStart={handleStart} />;
        }
      })()}
    </>
  );
}
