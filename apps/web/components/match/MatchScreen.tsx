'use client';

import {
  MATCH_OPPONENTS,
  type MatchDisplay,
  type MatchOpponent,
  getAILineup,
  getUserLineup,
  runMatch,
} from '@/lib/match-data';
/**
 * MatchScreen — orquestrador do fluxo de partida.
 *
 * Máquina de estados:
 *   idle → preMatch → simulating → result
 *
 *   idle:       seleção de adversário
 *   preMatch:   escalações + probabilidade + botão jogar
 *   simulating: animação enquanto simulateSquadMatch roda (assíncrono via setTimeout)
 *   result:     ScoreBoard + Timeline + Stats + Rewards
 *
 * A simulação real (simulateSquadMatch) roda em um setTimeout de 1,8s
 * para dar tempo à animação de campo. O resultado é computado
 * sincronamente assim que o timer dispara.
 */
import { useCallback, useState } from 'react';
import { MatchAnimation } from './MatchAnimation';
import { MatchResultView } from './MatchResultView';
import { OpponentSelector } from './OpponentSelector';
import { PreMatchView } from './PreMatchView';

// ─── Estado da tela ───────────────────────────────────────────────────────────

type Phase = 'idle' | 'preMatch' | 'simulating' | 'result';

// ─── Componente ───────────────────────────────────────────────────────────────

export function MatchScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [opponent, setOpponent] = useState<MatchOpponent | null>(null);
  const [result, setResult] = useState<MatchDisplay | null>(null);
  const [seed, setSeed] = useState(42);

  const userLineup = getUserLineup();

  // ── idle → preMatch ──────────────────────────────────────────────────────────

  const handleSelectOpponent = useCallback((opp: MatchOpponent) => {
    setOpponent(opp);
    setPhase('preMatch');
  }, []);

  // ── preMatch → simulating → result ──────────────────────────────────────────

  const handlePlay = useCallback(() => {
    if (!opponent) return;
    setPhase('simulating');

    const matchSeed = seed ^ Date.now();

    // Animação de 1.8s, depois rodar simulação real
    setTimeout(() => {
      const display = runMatch(opponent, matchSeed);
      setResult(display);
      setSeed((s) => s + 1);
      setPhase('result');
    }, 1800);
  }, [opponent, seed]);

  // ── result → preMatch (revanche) ────────────────────────────────────────────

  const handleRematch = useCallback(() => {
    setResult(null);
    setPhase('preMatch');
  }, []);

  // ── qualquer → idle ──────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    setResult(null);
    setOpponent(null);
    setPhase('idle');
  }, []);

  // ── Render por fase ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto">
      {phase === 'idle' && (
        <div className="animate-[fadeIn_0.35s_ease-out]">
          <OpponentSelector
            opponents={MATCH_OPPONENTS}
            selected={null}
            onSelect={handleSelectOpponent}
          />
        </div>
      )}

      {phase === 'preMatch' && opponent && (
        <PreMatchView
          opponent={opponent}
          userLineup={userLineup}
          awayLineup={getAILineup(opponent)}
          onPlay={handlePlay}
          onBack={handleBack}
        />
      )}

      {phase === 'simulating' && opponent && <MatchAnimation opponent={opponent} />}

      {phase === 'result' && result && opponent && (
        <MatchResultView
          result={result}
          opponent={opponent}
          onRematch={handleRematch}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
