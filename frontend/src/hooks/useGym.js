import { useState, useCallback } from 'react';
import { extractClaims, argue, getVerdict } from '../lib/api';

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

const STARTER_TOPICS = [
  'AI will replace most human jobs',
  'Universal Basic Income would help society',
  'Social media does more harm than good',
  'Nuclear energy is the future of clean power',
  'Remote work is better than office work',
  'Smartphones have made us less intelligent',
  'Capitalism is the best economic system',
  'Space exploration is worth the cost',
];

export function useGym() {
  const [phase, setPhase] = useState(PHASES.LANDING);
  const [topic, setTopic] = useState('');
  const [stance, setStance] = useState('for');
  const [difficulty, setDifficulty] = useState('rigorous');
  const [statement, setStatement] = useState('');
  const [claims, setClaims] = useState([]);
  const [claimSummary, setClaimSummary] = useState('');
  const [messages, setMessages] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sideSwitch, setSideSwitch] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [runningScores, setRunningScores] = useState({ logic: 0, evidence: 0, originality: 0 });
  const MAX_ROUNDS = 5;

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
      const data = await extractClaims({ statement, topic, stance, difficulty });
      setClaims(data.claims);
      setClaimSummary(data.summary);
      setPhase(PHASES.CLAIMS_CONFIRM);
    } catch (e) {
      setError('Failed to process your argument. Check your API connection.');
      setPhase(PHASES.STATEMENT);
    }
  }, [statement, topic, stance, difficulty]);

  const confirmClaims = useCallback(async () => {
    setPhase(PHASES.SPARRING);
    setLoading(true);
    setError('');

    const openingMsg = { role: 'user', content: `My opening argument: ${statement}` };
    const newMessages = [openingMsg];
    setMessages(newMessages);

    try {
      const data = await argue({ messages: newMessages, topic, stance, difficulty, claims });
      const aiMsg = { role: 'assistant', content: data.argument };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);

      const round = { round: 1, userArg: statement, aiArg: data.argument, scores: data.scores };
      setRounds([round]);
      setCurrentRound(1);
      updateRunningScores([round]);
    } catch (e) {
      setError('AI failed to respond. Try again.');
    }
    setLoading(false);
  }, [statement, topic, stance, difficulty, claims]);

  const updateRunningScores = (roundsArr) => {
    if (!roundsArr.length) return;
    const avg = (key) => Math.round(roundsArr.reduce((s, r) => s + (r.scores?.[key] || 0), 0) / roundsArr.length * 10);
    setRunningScores({ logic: avg('logic'), evidence: avg('evidence'), originality: avg('originality') });
  };

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
      const data = await argue({ messages: newMessages, topic, stance, difficulty, claims });
      const aiMsg = { role: 'assistant', content: data.argument };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);

      const round = { round: nextRound, userArg: userInput, aiArg: data.argument, scores: data.scores };
      const newRounds = [...rounds, round];
      setRounds(newRounds);
      setCurrentRound(nextRound);
      updateRunningScores(newRounds);

      if (nextRound >= 3 && nextRound < MAX_ROUNDS && !sideSwitch) {
        setPhase(PHASES.SIDE_SWITCH_OFFER);
      } else if (nextRound >= MAX_ROUNDS) {
        await fetchVerdict(updatedMessages);
      }
    } catch (e) {
      setError('AI failed to respond. Try again.');
    }
    setLoading(false);
  }, [userInput, loading, messages, currentRound, rounds, topic, stance, difficulty, claims, sideSwitch]);

  const declineSideSwitch = useCallback(() => {
    setPhase(PHASES.SPARRING);
  }, []);

  const acceptSideSwitch = useCallback(async () => {
    setSideSwitch(true);
    setPhase(PHASES.SIDE_SWITCHING);
    setLoading(true);

    const switchMsg = { role: 'user', content: `[SIDE SWITCH] I will now argue the OPPOSITE position. My new stance is: ${stance === 'for' ? 'against' : 'for'} the topic. Please now defend my original position.` };
    const newMessages = [...messages, switchMsg];
    setMessages(newMessages);

    try {
      const data = await argue({ messages: newMessages, topic, stance: stance === 'for' ? 'against' : 'for', difficulty, claims });
      const aiMsg = { role: 'assistant', content: data.argument };
      setMessages([...newMessages, aiMsg]);
      setPhase(PHASES.SPARRING);
    } catch (e) {
      setError('Side switch failed. Try again.');
      setPhase(PHASES.SIDE_SWITCH_OFFER);
    }
    setLoading(false);
  }, [messages, topic, stance, difficulty, claims]);

  const fetchVerdict = useCallback(async (msgs) => {
    setPhase(PHASES.VERDICT_LOADING);
    try {
      const data = await getVerdict({ messages: msgs || messages, topic, stance, difficulty, claims, sideSwitch });
      setVerdict(data);
      setPhase(PHASES.VERDICT);
    } catch (e) {
      setError('Failed to generate verdict.');
      setPhase(PHASES.SPARRING);
    }
  }, [messages, topic, stance, difficulty, claims, sideSwitch]);

  const endEarly = useCallback(() => fetchVerdict(messages), [fetchVerdict, messages]);

  const reset = useCallback(() => {
    setPhase(PHASES.LANDING);
    setTopic(''); setStance('for'); setDifficulty('rigorous');
    setStatement(''); setClaims([]); setClaimSummary('');
    setMessages([]); setRounds([]); setCurrentRound(0);
    setUserInput(''); setLoading(false); setError('');
    setSideSwitch(false); setVerdict(null);
    setRunningScores({ logic: 0, evidence: 0, originality: 0 });
  }, []);

  return {
    phase, topic, setTopic, stance, setStance, difficulty, setDifficulty,
    statement, setStatement, claims, claimSummary, messages, rounds,
    currentRound, userInput, setUserInput, loading, error, sideSwitch,
    verdict, runningScores, MAX_ROUNDS, STARTER_TOPICS,
    startDebate, submitStatement, confirmClaims, submitRound,
    declineSideSwitch, acceptSideSwitch, endEarly, reset,
  };
}
