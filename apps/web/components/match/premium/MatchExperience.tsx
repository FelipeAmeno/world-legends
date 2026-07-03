'use client';

/**
 * MatchExperience — Sprint 5
 *
 * Máquina de estados:
 *   SELECT   → escolha de adversário
 *   LOADING  → simulação no servidor (server action)
 *   PRE      → lineups + probabilidade (countdown)
 *   LIVE     → replay progressivo de eventos
 *   HT       → intervalo com placar parcial (3.5s)
 *   RESULT   → resultado + estatísticas + MVP + recompensas
 */

import { playMatchAction } from '@/lib/actions';
import { MATCH_OPPONENTS } from '@/lib/match-data';
import { type MatchExperienceData, buildMatchExperienceData } from '@/lib/match-experience';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LiveMatchView } from './LiveMatchView';
import { MatchResultScreen } from './MatchResultScreen';
import { OpponentPicker } from './OpponentPicker';
import { PreMatchScreen } from './PreMatchScreen';

type Phase = 'SELECT' | 'LOADING' | 'PRE' | 'LIVE' | 'HT' | 'RESULT';

export function MatchExperience() {
  const [phase, setPhase] = useState<Phase>('SELECT');
  const [data, setData] = useState<MatchExperienceData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingOpponentRef = useRef<string | null>(null);

  // ── SELECT → LOADING → PRE ───────────────────────────────────────────────────
  const handleSelectOpponent = useCallback(async (opponentId: string) => {
    if (loadingOpponentRef.current === opponentId) return;
    loadingOpponentRef.current = opponentId;
    setLoadError(null);
    setPhase('LOADING');

    try {
      const result = await playMatchAction(opponentId);
      if (!result.ok) {
        setLoadError(result.error);
        setPhase('SELECT');
        loadingOpponentRef.current = null;
        return;
      }
      const experienceData = buildMatchExperienceData(
        result.display,
        result.opponent,
        result.matchId,
        result.newBalance,
      );
      setData(experienceData);
      setPhase('PRE');
    } catch {
      setLoadError('Erro ao iniciar partida. Tente novamente.');
      setPhase('SELECT');
    }
    loadingOpponentRef.current = null;
  }, []);

  // ── PRE → LIVE ───────────────────────────────────────────────────────────────
  const handleStartMatch = useCallback(() => {
    setPhase('LIVE');
  }, []);

  // ── LIVE → HT / RESULT ───────────────────────────────────────────────────────
  const handleHalfTime = useCallback(() => {
    setPhase('HT');
    setTimeout(() => setPhase('LIVE'), 3500);
  }, []);

  const handleFullTime = useCallback(() => {
    setTimeout(() => setPhase('RESULT'), 1500);
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const handleRematch = useCallback(async () => {
    if (!data) return;
    await handleSelectOpponent(data.opponent.id);
  }, [data, handleSelectOpponent]);

  const handleBack = useCallback(() => {
    setData(null);
    setPhase('SELECT');
  }, []);

  return (
    <div className="min-h-screen bg-[#060810] overflow-hidden relative">
      <AnimatePresence mode="wait">
        {/* SELECT */}
        {phase === 'SELECT' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-6"
          >
            <div className="mb-6">
              <h1 className="font-display text-3xl gold-text tracking-wider">PARTIDA</h1>
              <p className="text-muted text-xs mt-0.5">Escolha um adversário e viva cada lance</p>
            </div>
            {loadError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mb-4 glass rounded-lg px-3 py-2"
              >
                ⚠️ {loadError}
              </motion.p>
            )}
            <OpponentPicker opponents={MATCH_OPPONENTS} onSelect={handleSelectOpponent} />
          </motion.div>
        )}

        {/* LOADING */}
        {phase === 'LOADING' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-screen gap-6"
          >
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-gold/30 border-t-gold"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="text-center">
              <p className="font-display text-xl gold-text tracking-wider">PREPARANDO</p>
              <p className="text-muted text-xs mt-1">Simulando a partida…</p>
            </div>
          </motion.div>
        )}

        {/* PRE */}
        {phase === 'PRE' && data && (
          <motion.div
            key="pre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-screen"
          >
            <PreMatchScreen data={data} onKickoff={handleStartMatch} onBack={handleBack} />
          </motion.div>
        )}

        {/* LIVE + HT */}
        {(phase === 'LIVE' || phase === 'HT') && data && (
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen"
          >
            <LiveMatchView
              data={data}
              paused={phase === 'HT'}
              onHalfTime={handleHalfTime}
              onFullTime={handleFullTime}
            />
          </motion.div>
        )}

        {/* RESULT */}
        {phase === 'RESULT' && data && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <MatchResultScreen data={data} onRematch={handleRematch} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
