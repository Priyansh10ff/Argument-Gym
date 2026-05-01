import { useState, useCallback, useRef } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../lib/auth';
import { streamArgue, parseSSEStream } from '../lib/api';
import { updateLocalElo } from '../lib/identity';

export const PHASES = {
  LANDING:          'landing',
  STATEMENT:        'statement',
  EXTRACTING:       'extracting',
  CLAIMS_CONFIRM:   'claims_confirm',
  SPARRING:         'sparring',
  SIDE_SWITCH_OFFER:'side_switch_offer',
  SIDE_SWITCHING:   'side_switching',
  VERDICT_LOADING:  'verdict_loading',
  VERDICT:          'verdict',
};

export const MODES = {
  standard:  { id: 'standard',  name: 'Standard Gym', icon: '🥊', desc: 'Classic adversarial sparring' },
  courtroom: { id: 'courtroom', name: 'Court Gym',     icon: '⚖️', desc: 'Legal argument with live judge ruling' },
  sales:     { id: 'sales',     name: 'Sales Gym',     icon: '💼', desc: 'Buyer personas & objection memory' },
};

export const SCORE_LABELS = {
  standard:  { logic: 'LOGIC',           evidence: 'EVIDENCE',    originality: 'ORIGINALITY' },
  courtroom: { logic: 'LEGAL REASONING', evidence: 'PRECEDENT',   originality: 'STRATEGY' },
  sales:     { logic: 'PITCH FLOW',      evidence: 'PROOF POINTS', originality: 'DIFFERENTIATION' },
};

export const AI_LABEL = {
  standard:  'GYM AI',
  courtroom: 'COUNSEL',
  sales:     'BUYER',
};

export const AI_MODELS = [
  { id: 'auto',   name: 'Auto (Free)',       badge: 'OPENROUTER', desc: 'Qwen 3 Plus — free tier' },
  { id: 'claude', name: 'Claude Sonnet',     badge: 'ANTHROPIC',  desc: 'Best structured reasoning' },
  { id: 'gpt4',   name: 'GPT-4o',           badge: 'OPENAI',     desc: 'Strong all-round performance' },
  { id: 'gemini', name: 'Gemini Flash',      badge: 'GOOGLE',     desc: 'Fast with great context' },
  { id: 'llama',  name: 'Llama 3.1 70B',    badge: 'META',       desc: 'Open-source powerhouse' },
];

const MAX_CLAIM_HP = 3;

export function useGym() {
  const [phase, setPhase]               = useState(PHASES.LANDING);
  const [mode, setMode]                 = useState('standard');
  const [model, setModel]               = useState('auto');
  const [topic, setTopic]               = useState('');
  const [stance, setStance]             = useState('for');
  const [difficulty, setDifficulty]     = useState('rigorous');
  const [scenario, setScenario]         = useState('');
  const [persona, setPersona]           = useState('skeptical_cfo');
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
  const [streamingText, setStreamingText] = useState('');
  const MAX_ROUNDS = 5;

  const messagesRef = useRef([]);
  messagesRef.current = messages;

  // Convex actions
  const extractClaimsAction = useAction(api.llm.extractClaims);
  const argueAction = useAction(api.llm.argue);
  const getVerdictAction = useAction(api.llm.getVerdict);
  const updateEloMutation = useMutation(api.users.updateElo);
  const updateWeaknessAction = useMutation(api.weaknessProfiles.update);

  // Auth
  let auth;
  try {
    auth = useAuth();
  } catch (_) {
    auth = null;
  }

  const weaknessProfile = useQuery(api.weaknessProfiles.get, 
    auth?.user?._id ? { userId: auth.user._id } : "skip"
  );

  const updateRunningScores = (roundsArr) => {
    if (!roundsArr.length) return;
    const avg = (key) => Math.round(
      roundsArr.reduce((s, r) => s + (r.scores?.[key] || 0), 0) / roundsArr.length * 10
    );
    setRunningScores({ logic: avg('logic'), evidence: avg('evidence'), originality: avg('originality') });
  };

  // ── Streaming argue call ──
  const argueStream = useCallback(async (msgs, currentClaims, currentMode, currentTopic, currentStance, currentDifficulty, currentScenario, currentPersona) => {
    setStreamingText('');
    try {
      const reader = await streamArgue({
        messages: msgs,
        topic: currentTopic || topic,
        stance: currentStance || stance,
        difficulty: currentDifficulty || difficulty,
        claims: currentClaims || claims,
        mode: currentMode || mode,
        scenario: currentScenario || scenario,
        persona: currentPersona || persona,
        model,
        weaknessProfile: weaknessProfile || null,
      });

      let finalData = null;
      let streamedText = '';

      for await (const event of parseSSEStream(reader)) {
        if (event.done) {
          finalData = event;
        } else if (event.token) {
          streamedText += event.token;
          setStreamingText(streamedText);
        } else if (event.error) {
          throw new Error(event.error);
        }
      }

      setStreamingText('');
      return finalData || { argument: streamedText, scores: { logic: 7, evidence: 6, originality: 7, roundFeedback: '' }, claimHits: [false, false, false], judgeRuling: null };
    } catch (e) {
      setStreamingText('');
      // Fallback to non-streaming
      return await argueAction({
        messages: msgs,
        topic: currentTopic || topic,
        stance: currentStance || stance,
        difficulty: currentDifficulty || difficulty,
        claims: currentClaims || claims,
        mode: currentMode || mode,
        scenario: currentScenario || scenario,
        persona: currentPersona || persona,
        model,
        weaknessProfile: weaknessProfile || null,
      });
    }
  }, [topic, stance, difficulty, claims, mode, scenario, persona, model, argueAction, weaknessProfile]);

  const fetchVerdict = useCallback(async (msgs) => {
    const finalMsgs = msgs || messagesRef.current;
    setPhase(PHASES.VERDICT_LOADING);
    try {
      const data = await getVerdictAction({
        messages: finalMsgs, topic, stance, difficulty,
        claims, sideSwitch, mode, scenario, persona, model,
      });
      setVerdict(data);
      setPhase(PHASES.VERDICT);

      // Update ELO
      try {
        if (auth?.user?._id) {
          const elo = await updateEloMutation({
            userId: auth.user._id,
            verdict: data.verdict,
            scores: data.scores ? {
              logic: data.scores.logic || 0,
              evidence: data.scores.evidence || 0,
              originality: data.scores.originality || 0,
            } : undefined,
            topic, mode,
            transcript: finalMsgs,
          });
          setEloResult(elo);

          // Update weakness profile
          try {
            await updateWeaknessAction({
              userId: auth.user._id,
              scores: data.scores ? {
                logic: data.scores.logic || 0,
                evidence: data.scores.evidence || 0,
                originality: data.scores.originality || 0,
              } : undefined,
              weaknesses: data.weaknesses,
              overallFeedback: data.overallFeedback,
            });
          } catch (_) {}
        } else {
          // Local ELO fallback if no user id
          const elo = updateLocalElo(data.verdict, mode);
          setEloResult(elo);
        }
      } catch (_) {}
    } catch (e) {
      setError(e.message || 'Failed to generate verdict.');
      setPhase(PHASES.SPARRING);
    }
  }, [topic, stance, difficulty, claims, sideSwitch, mode, scenario, persona, model, auth, getVerdictAction, updateEloMutation, updateWeaknessAction]);

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
      const data = await extractClaimsAction({
        statement, topic, stance, difficulty, mode, scenario, persona, model,
      });
      setClaims(data.claims);
      setClaimSummary(data.summary);
      setClaimsHp([MAX_CLAIM_HP, MAX_CLAIM_HP, MAX_CLAIM_HP]);
      setPhase(PHASES.CLAIMS_CONFIRM);
    } catch (e) {
      setError(e.message || 'Failed to process your argument. Check your API connection.');
      setPhase(PHASES.STATEMENT);
    }
  }, [statement, topic, stance, difficulty, mode, scenario, persona, model, extractClaimsAction]);

  const confirmClaims = useCallback(async () => {
    setPhase(PHASES.SPARRING);
    setLoading(true);
    setError('');
    const openingMsg = { role: 'user', content: `My opening argument: ${statement}` };
    const newMessages = [openingMsg];
    setMessages(newMessages);
    try {
      const data = await argueStream(newMessages, claims, mode, topic, stance, difficulty, scenario, persona);
      const aiMsg = { role: 'assistant', content: data.argument };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);
      const round = { round: 1, userArg: statement, aiArg: data.argument, scores: data.scores, claimHits: data.claimHits, judgeRuling: data.judgeRuling };
      setRounds([round]);
      setCurrentRound(1);
      updateRunningScores([round]);
      const newHp = [MAX_CLAIM_HP, MAX_CLAIM_HP, MAX_CLAIM_HP].map(
        (hp, i) => data.claimHits?.[i] ? Math.max(0, hp - 1) : hp
      );
      setClaimsHp(newHp);
      if (newHp.every(hp => hp === 0)) fetchVerdict(updated);
    } catch (e) {
      setError(e.message || 'AI failed to respond. Try again.');
    }
    setLoading(false);
  }, [statement, topic, stance, difficulty, claims, mode, scenario, persona, fetchVerdict, argueStream]);

  const submitRound = useCallback(async () => {
    if (!userInput.trim() || loading) return;
    const nextRound = currentRound + 1;
    setLoading(true);
    setError('');

    const userMsg     = { role: 'user', content: userInput };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserInput('');

    try {
      const data = await argueStream(newMessages, claims, mode, topic, stance, difficulty, scenario, persona);
      const aiMsg = { role: 'assistant', content: data.argument };
      const updated = [...newMessages, aiMsg];
      setMessages(updated);

      const round = { round: nextRound, userArg: userInput, aiArg: data.argument, scores: data.scores, claimHits: data.claimHits, judgeRuling: data.judgeRuling };
      const newRounds = [...rounds, round];
      setRounds(newRounds);
      setCurrentRound(nextRound);
      updateRunningScores(newRounds);

      const newHp = claimsHp.map(
        (hp, i) => data.claimHits?.[i] ? Math.max(0, hp - 1) : hp
      );
      setClaimsHp(newHp);

      if (newHp.every(hp => hp === 0)) {
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
  }, [userInput, loading, messages, currentRound, rounds, claimsHp, topic, stance, difficulty, claims, sideSwitch, mode, scenario, persona, fetchVerdict, argueStream]);

  const declineSideSwitch = useCallback(() => setPhase(PHASES.SPARRING), []);

  const acceptSideSwitch = useCallback(async () => {
    setSideSwitch(true);
    setPhase(PHASES.SIDE_SWITCHING);
    setLoading(true);
    const switchMsg = {
      role: 'user',
      content: `[SIDE SWITCH] I will now argue the OPPOSITE position. New stance: ${stance === 'for' ? 'against' : 'for'}. Please now defend my original position.`
    };
    const newMessages = [...messages, switchMsg];
    setMessages(newMessages);
    try {
      const data = await argueStream(newMessages, claims, mode, topic, stance === 'for' ? 'against' : 'for', difficulty, scenario, persona);
      setMessages([...newMessages, { role: 'assistant', content: data.argument }]);
      setPhase(PHASES.SPARRING);
    } catch (e) {
      setError('Side switch failed. Try again.');
      setPhase(PHASES.SIDE_SWITCH_OFFER);
    }
    setLoading(false);
  }, [messages, topic, stance, difficulty, claims, mode, scenario, persona, argueStream]);

  const endEarly = useCallback(() => fetchVerdict(), [fetchVerdict]);

  const reset = useCallback(() => {
    setPhase(PHASES.LANDING);
    setMode('standard'); setModel('auto'); setTopic(''); setStance('for'); setDifficulty('rigorous');
    setScenario(''); setPersona('skeptical_cfo');
    setStatement(''); setClaims([]); setClaimSummary('');
    setClaimsHp([MAX_CLAIM_HP, MAX_CLAIM_HP, MAX_CLAIM_HP]);
    setMessages([]); setRounds([]); setCurrentRound(0);
    setUserInput(''); setLoading(false); setError('');
    setSideSwitch(false); setVerdict(null); setEloResult(null);
    setRunningScores({ logic: 0, evidence: 0, originality: 0 });
    setStreamingText('');
  }, []);

  return {
    phase, mode, setMode, model, setModel, topic, setTopic, stance, setStance,
    difficulty, setDifficulty, scenario, setScenario, persona, setPersona,
    statement, setStatement, claims, claimSummary, claimsHp, MAX_CLAIM_HP,
    messages, rounds, currentRound, userInput, setUserInput,
    loading, error, sideSwitch, verdict, runningScores,
    eloResult, MAX_ROUNDS, streamingText,
    startDebate, submitStatement, confirmClaims, submitRound,
    declineSideSwitch, acceptSideSwitch, endEarly, reset,
  };
}
