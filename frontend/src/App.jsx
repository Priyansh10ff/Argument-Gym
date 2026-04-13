import React from 'react';
import { useGym, PHASES } from './hooks/useGym';
import Landing from './components/Landing';
import Statement from './components/Statement';
import ClaimsConfirm from './components/ClaimsConfirm';
import Sparring from './components/Sparring';
import SideSwitchOffer from './components/SideSwitchOffer';
import Verdict from './components/Verdict';
import Loader from './components/Loader';

export default function App() {
  const gym = useGym();

  const handleStart = ({ topic, stance, difficulty }) => {
    gym.setTopic(topic);
    gym.setStance(stance);
    gym.setDifficulty(difficulty);
    gym.startDebate(topic);
  };

  switch (gym.phase) {
    case PHASES.LANDING:
      return <Landing onStart={handleStart} />;

    case PHASES.STATEMENT:
      return (
        <Statement
          topic={gym.topic}
          stance={gym.stance}
          difficulty={gym.difficulty}
          statement={gym.statement}
          setStatement={gym.setStatement}
          onSubmit={gym.submitStatement}
          onBack={gym.reset}
          loading={gym.loading}
        />
      );

    case PHASES.EXTRACTING:
      return <Loader message="ANALYZING YOUR ARGUMENT" sub="Extracting core claims..." />;

    case PHASES.CLAIMS_CONFIRM:
      return (
        <ClaimsConfirm
          claims={gym.claims}
          claimSummary={gym.claimSummary}
          topic={gym.topic}
          onConfirm={gym.confirmClaims}
          loading={gym.loading}
        />
      );

    case PHASES.SPARRING:
    case PHASES.SIDE_SWITCHING:
      return (
        <Sparring
          topic={gym.topic}
          stance={gym.stance}
          difficulty={gym.difficulty}
          claims={gym.claims}
          rounds={gym.rounds}
          currentRound={gym.currentRound}
          userInput={gym.userInput}
          setUserInput={gym.setUserInput}
          loading={gym.loading || gym.phase === PHASES.SIDE_SWITCHING}
          error={gym.error}
          runningScores={gym.runningScores}
          MAX_ROUNDS={gym.MAX_ROUNDS}
          onSubmit={gym.submitRound}
          onEndEarly={gym.endEarly}
          sideSwitch={gym.sideSwitch}
        />
      );

    case PHASES.SIDE_SWITCH_OFFER:
      return (
        <SideSwitchOffer
          stance={gym.stance}
          onAccept={gym.acceptSideSwitch}
          onDecline={gym.declineSideSwitch}
          loading={gym.loading}
        />
      );

    case PHASES.VERDICT_LOADING:
      return <Loader message="CALCULATING VERDICT" sub="Reviewing all rounds..." />;

    case PHASES.VERDICT:
      return (
        <Verdict
          verdict={gym.verdict}
          topic={gym.topic}
          stance={gym.stance}
          sideSwitch={gym.sideSwitch}
          onReset={gym.reset}
        />
      );

    default:
      return <Landing onStart={handleStart} />;
  }
}
