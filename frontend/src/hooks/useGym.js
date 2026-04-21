import { useState, useCallback, useRef } from 'react';
import { extractClaims, argue, getVerdict, updateElo } from '../lib/api';
import { getUserId } from '../lib/identity';

export const PHASES = {
  LANDING: 'landing',
  STATEMENT: 'statement',
  EXTRACTING: 'extracting',
  CLAIMS_CONFIRM: 'claims_confirm',
  SPARRING: 'sparring',
  SIDE_SWITCH_OFFER: 'side_switch_offer',
  SIDE_SWITCHING: 'side_switching',
  VERDICT_LOADING: 'verdict_loading',
  VERDICT: 'verdict',
};

export const MODES = {
  standard:  { id: 'standard',  name: 'Standard Gym', icon: '🥊', desc: 'Classic adversarial sparring' },
  courtroom: { id: 'courtroom', name: 'Court Gym',     icon: '⚖️', desc: 'Legal argument & cross-examination' },
  sales:     { id: 'sales',     name: 'Sales Gym',     icon: '💼', desc: 'Pitch & persuasion training' },
};

export const SCORE_LABELS = {
  standard:  { logic: 'LOGIC',          evidence: 'EVIDENCE',   originality: 'ORIGINALITY' },
  courtroom: { logic: 'LEGAL REASONING', evidence: 'PRECEDENT',  originality: 'STRATEGY' },
  sales:     { logic: 'PITCH FLOW',      evidence: 'PROOF POINTS', originality: 'DIFFERENTIATION' },
};

export const AI_LABEL = {
  standard:  'GYM AI',
  courtroom: 'COUNSEL',
  sales:     'BUYER',
};

const MAX_CLAIM_HP = 3;

export function useGym() {
  const [phase, setPhase]               = useState(PHASES.LANDING);
  const [mode, setMode]                 = useState('standard');
  const [topic, setTopic]               = useState('');
  const [stance, setStance]             = useState('for');
  const [difficulty, setDifficulty]     = useState('rigorous');
  const [statement, setStatement]       = useState('');
  const [claims, setClaims]             = useState([]);
  const [claimSummary, setClaimSummary] = useState('');
  const [claimsHp, setClaimsHp]         = useState([MAX_CLAIM_HP, MAX_CLAIM_HP, MAX_CLAIM_HP]);
  const [messages, setMessages]         = useState([]);
  const [rounds, setRounds]             = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userInput, setUserInput]       = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [sideSwitch, setSideSwitch]     = useState(false);
  const [verdict, setVerdict]           = useState(null);
  const [runningScores, setRunningScores] = useState({ logic: 0, evidence: 0, originality: 0 });
  const [eloResult, setEloResult]       = useState(null);
  const MAX_ROUNDS = 5;

  // Use a ref so fetchVerdict always has the latest messages without stale closure
  const messagesRef = useRef([]);
  messagesRef.current = messages;

  const updateRunningScores = (roundsArr) => {
    if (!roundsArr.length) return;
    const avg = (key) => Math.round(
      roundsArr.reduce((s, r) => s + (r.scores?.[key] || 0), 0) / roundsArr.length * 10
    );
    setRunningScores({ logic: avg('logic'), evidence: avg('evidence'), originality: avg('originality') });
  };

  const fetchVerdict = useCallback(async (msgs) => {
    const finalMsgs = msgs || messagesRef.current;
    setPhase(PHASES.VERDICT_LOADING);
    try {
      const data = await getVerdict({
        messages: finalMsgs, topic, stance, difficulty, claims, sideSwitch, mode
      });
      setVerdict(data);
      setPhase(PHASES.VERDICT);
      // Update ELO silently
      try {
        const result = await updateElo({
          userId: getUserId(), verdict: data.verdict,
          scores: data.scores, topic, mode
        });
        setEloResult(result);
      } catch (_) {}
    } catch (e) {
      setError('Failed to generate verdict.');
      setPhase(PHASES.SPARRING);
    }
  }, [topic, stance, difficulty, claims, sideSwitch, mode]);

  const startDebate = useCallback((selectedTopic) => {
    setTopic(selectedTopic || topic);
    setPhase(PHASES.STATEMENT);
    setError('');
  }, [topic]);

  const submitStatement = useCallback(async () => {
    if (!statement.trim()) return;
    setPhase(PHASES.EXTRACTING);
    setError('');
    try {
      const data = await extractClaims({ statement, topic, stance, difficulty, mode });
      setClaims(data.claims);
      setClaimSummary(data.summary);
      setClaimsHp([MAX_CLAIM_HP, MAX_CLAIM_HP, MAX_CLAIM_HP]);
      setPhase(PHASES.CLAIMS_CONFIRM);
    } catch (e) {
      setError('Failed to process your argument. Check your API connection.');
      setPhase(PHASES.STATEMENT);
    }
  }, [statement, topic, stance, difficulty, mode]);

  const confirmClaims = useCallback(async () => {
    setPhase(PHASES.SPARRING);
    setLoading(true);
    setError('');
    const openingMsg = { role: 'user', content: `My opening argument: ${statement}` };
    const newMessages = [openingMsg];
    setMessages(newMessages);
    try {
      const data = await argue({ messages: newMessages, topic, stance, difficulty, claims, mode });
      const aiMsg = { role: 'assistant', content: data.argument };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      const round = { round: 1, userArg: statement, aiArg: data.argument, scores: data.scores, claimHits: data.claimHits };
      setRounds([round]);
      setCurrentRound(1);
      updateRunningScores([round]);
      // Apply first-round claim hits
      const newHp = [MAX_CLAIM_HP, MAX_CLAIM_HP, MAX_CLAIM_HP].map(
        (hp, i) => data.claimHits?.[i] ? Math.max(0, hp - 1) : hp
      );
      setClaimsHp(newHp);
      if (newHp.every(hp => hp === 0)) fetchVerdict(updated);
    } catch (e) {
      setError('AI failed to respond. Try again.');
    }
    setLoading(false);
  }, [statement, topic, stance, difficulty, claims, mode, fetchVerdict]);

  const submitRound = useCallback(async () => {
    if (!userInput.trim() || loading) return;
    const nextRound = currentRound + 1;
    setLoading(true);
    setError('');

    const userMsg = { role: 'user', content: userInput };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');

    try {
      const data = await argue({ messages: newMessages, topic, stance, difficulty, claims, mode });
      const aiMsg = { role: 'assistant', content: data.argument };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);

      const round = { round: nextRound, userArg: userInput, aiArg: data.argument, scores: data.scores, claimHits: data.claimHits };
      const newRounds = [...rounds, round];
      setRounds(newRounds);
      setCurrentRound(nextRound);
      updateRunningScores(newRounds);

      // Compute new HP synchronously — no state setter nesting
      const newHp = claimsHp.map(
        (hp, i) => data.claimHits?.[i] ? Math.max(0, hp - 1) : hp
      );
      setClaimsHp(newHp);

      // Decide next phase
      if (newHp.every(hp => hp === 0)) {
        // All claims broken → immediate verdict
        await fetchVerdict(updated);
      } else if (nextRound >= MAX_ROUNDS) {
        await fetchVerdict(updated);
      } else if (nextRound >= 3 && !sideSwitch) {
        setPhase(PHASES.SIDE_SWITCH_OFFER);
      }
    } catch (e) {
      setError('AI failed to respond. Try again.');
    }
    setLoading(false);
  }, [userInput, loading, messages, currentRound, rounds, claimsHp, topic, stance, difficulty, claims, sideSwitch, mode, fetchVerdict]);

  const declineSideSwitch = useCallback(() => setPhase(PHASES.SPARRING), []);

  const acceptSideSwitch = useCallback(async () => {
    setSideSwitch(true);
    setPhase(PHASES.SIDE_SWITCHING);
    setLoading(true);
    const switchMsg = {
      role: 'user',
      content: `[SIDE SWITCH] I will now argue the OPPOSITE position. My new stance is: ${stance === 'for' ? 'against' : 'for'} the topic. Please now defend my original position.`
    };
    const newMessages = [...messages, switchMsg];
    setMessages(newMessages);
    try {
      const data = await argue({ messages: newMessages, topic, stance: stance === 'for' ? 'against' : 'for', difficulty, claims, mode });
      setMessages([...newMessages, { role: 'assistant', content: data.argument }]);
      setPhase(PHASES.SPARRING);
    } catch (e) {
      setError('Side switch failed. Try again.');
      setPhase(PHASES.SIDE_SWITCH_OFFER);
    }
    setLoading(false);
  }, [messages, topic, stance, difficulty, claims, mode]);

  const endEarly = useCallback(() => fetchVerdict(), [fetchVerdict]);

  const reset = useCallback(() => {
    setPhase(PHASES.LANDING);
    setTopic(''); setStance('for'); setDifficulty('rigorous'); setMode('standard');
    setStatement(''); setClaims([]); setClaimSummary('');
    setClaimsHp([MAX_CLAIM_HP, MAX_CLAIM_HP, MAX_CLAIM_HP]);
    setMessages([]); setRounds([]); setCurrentRound(0);
    setUserInput(''); setLoading(false); setError('');
    setSideSwitch(false); setVerdict(null); setEloResult(null);
    setRunningScores({ logic: 0, evidence: 0, originality: 0 });
  }, []);

  return {
    phase, mode, setMode, topic, setTopic, stance, setStance,
    difficulty, setDifficulty, statement, setStatement,
    claims, claimSummary, claimsHp, MAX_CLAIM_HP,
    messages, rounds, currentRound, userInput, setUserInput,
    loading, error, sideSwitch, verdict, runningScores,
    eloResult, MAX_ROUNDS,
    startDebate, submitStatement, confirmClaims, submitRound,
    declineSideSwitch, acceptSideSwitch, endEarly, reset,
  };
}
