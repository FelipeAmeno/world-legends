'use client';

/**
 * MatchExperience — Sprint 5, reformulado na Sprint 26 (Gameplay
 * Foundation) pra ter um intervalo de verdade em vez de um pause
 * cosmético de 3.5s.
 *
 * Máquina de estados:
 *   SELECT   → escolha de adversário + dificuldade
 *   LOADING  → server action em voo (início OU continuação após o HT)
 *   BLOCKED  → sem squad válido — Prioridade 0, bloqueia e manda montar time
 *   INTRO    → apresentação do estádio
 *   PRE      → lineups (REAIS, do squad salvo) + probabilidade (countdown)
 *   LIVE     → replay progressivo de eventos (1º OU 2º tempo, ver `half`)
 *   HT       → intervalo JOGÁVEL: stats reais + Substituições/Tática/Continuar
 *   RESULT   → resultado + estatísticas + MVP + recompensas
 */

import {
  applySubstitutionAction,
  applyTacticAction,
  continueMatchAction,
  startMatchAction,
} from '@/lib/actions';
import type { StartMatchResult } from '@/lib/actions/match.types';
import {
  DIFFICULTY_DEFS,
  type LineupPlayer,
  MATCH_OPPONENTS,
  type MatchDifficulty,
  type MatchOpponent,
} from '@/lib/match-data';
import {
  type MatchExperienceData,
  buildMatchExperienceData,
  buildRichEvents,
} from '@/lib/match-experience';
import type { HalftimeDisplay } from '@/lib/match-session';
import type { MatchProgressState, TacticalIntensity } from '@world-legends/engine';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { HalftimeScreen } from './HalftimeScreen';
import { LiveMatchView } from './LiveMatchView';
import { MatchResultScreen } from './MatchResultScreen';
import { OpponentPicker } from './OpponentPicker';
import { PreMatchScreen } from './PreMatchScreen';
import { SquadRequiredScreen } from './SquadRequiredScreen';
import { StadiumIntro } from './StadiumIntro';

type Phase = 'SELECT' | 'LOADING' | 'BLOCKED' | 'INTRO' | 'PRE' | 'LIVE' | 'HT' | 'RESULT';

type Props = {
  userOvr?: number;
};

function averageOvr(players: LineupPlayer[]): number {
  if (players.length === 0) return 0;
  return Math.round(players.reduce((sum, p) => sum + p.ovr, 0) / players.length);
}

export function MatchExperience({ userOvr = 0 }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('SELECT');
  const [difficulty, setDifficulty] = useState<MatchDifficulty>('normal');
  const [opponent, setOpponent] = useState<MatchOpponent | null>(null);
  const [matchState, setMatchState] = useState<MatchProgressState | null>(null);
  const [halftime, setHalftime] = useState<HalftimeDisplay | null>(null);
  const [half, setHalf] = useState<1 | 2>(1);
  const [finalData, setFinalData] = useState<MatchExperienceData | null>(null);
  const [blockInfo, setBlockInfo] = useState<{
    code: 'NO_SQUAD' | 'INVALID_SQUAD';
    errors?: string[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState('Simulando a partida…');
  const [htError, setHtError] = useState<string | null>(null);
  const [htBusy, setHtBusy] = useState(false);
  const loadingOpponentRef = useRef<string | null>(null);

  // ── SELECT → LOADING → PRE/BLOCKED ────────────────────────────────────────
  const handleStartFailure = useCallback((res: Extract<StartMatchResult, { ok: false }>) => {
    if (res.code === 'NO_SQUAD' || res.code === 'INVALID_SQUAD') {
      setBlockInfo({ code: res.code, ...(res.errors ? { errors: res.errors } : {}) });
      setPhase('BLOCKED');
    } else {
      setLoadError(res.error);
      setPhase('SELECT');
    }
  }, []);

  const handleFinishedBeforeHalftime = useCallback(
    (result: Extract<StartMatchResult, { kind: 'finished' }>['result']) => {
      // W.O. técnico ainda no 1º tempo — raríssimo, mas tratado.
      if (!result.ok) {
        setLoadError(result.error);
        setPhase('SELECT');
        return;
      }
      setFinalData(
        buildMatchExperienceData(
          result.display,
          result.opponent,
          result.matchId,
          result.newBalance,
        ),
      );
      setPhase('RESULT');
    },
    [],
  );

  const handleSelectOpponent = useCallback(
    async (opponentId: string) => {
      if (loadingOpponentRef.current === opponentId) return;
      loadingOpponentRef.current = opponentId;
      setLoadError(null);
      setLoadingLabel('Validando seu time…');
      setPhase('LOADING');

      try {
        const res = await startMatchAction(opponentId, difficulty);
        if (!res.ok) {
          handleStartFailure(res);
        } else if (res.kind === 'finished') {
          handleFinishedBeforeHalftime(res.result);
        } else {
          setOpponent(res.opponent);
          setMatchState(res.state);
          setHalftime(res.halftime);
          setHalf(1);
          setPhase('INTRO');
        }
      } catch {
        setLoadError('Erro ao iniciar partida. Tente novamente.');
        setPhase('SELECT');
      }
      loadingOpponentRef.current = null;
    },
    [difficulty, handleStartFailure, handleFinishedBeforeHalftime],
  );

  // ── PRE → LIVE (1º tempo) ─────────────────────────────────────────────────
  const handleStartMatch = useCallback(() => setPhase('LIVE'), []);

  // ── LIVE (1º tempo) → HT ──────────────────────────────────────────────────
  const handleHalfTime = useCallback(() => setPhase('HT'), []);

  // ── HT: substituição / tática (puras, sem sair do intervalo) ─────────────
  const handleSubstitute = useCallback(
    async (outgoingUserCardId: string, incomingUserCardId: string) => {
      if (!matchState || !opponent || htBusy) return;
      setHtBusy(true);
      setHtError(null);
      const res = await applySubstitutionAction(
        matchState,
        opponent.id,
        outgoingUserCardId,
        incomingUserCardId,
      );
      if (res.ok) {
        setMatchState(res.state);
        setHalftime(res.halftime);
      } else {
        setHtError(res.error);
      }
      setHtBusy(false);
    },
    [matchState, opponent, htBusy],
  );

  const handleChangeTactic = useCallback(
    async (intensity: TacticalIntensity) => {
      if (!matchState || !opponent || htBusy) return;
      setHtBusy(true);
      setHtError(null);
      const res = await applyTacticAction(matchState, opponent.id, intensity);
      if (res.ok) {
        setMatchState(res.state);
        setHalftime(res.halftime);
      } else {
        setHtError(res.error);
      }
      setHtBusy(false);
    },
    [matchState, opponent, htBusy],
  );

  // ── HT → LOADING → LIVE (2º tempo) ────────────────────────────────────────
  const handleContinue = useCallback(async () => {
    if (!matchState || !opponent) return;
    setLoadingLabel('Preparando o 2º tempo…');
    setPhase('LOADING');
    try {
      const result = await continueMatchAction(matchState, opponent.id, difficulty);
      if (!result.ok) {
        setLoadError(result.error);
        setPhase('HT');
        return;
      }
      setFinalData(
        buildMatchExperienceData(
          result.display,
          result.opponent,
          result.matchId,
          result.newBalance,
        ),
      );
      setHalf(2);
      setPhase('LIVE');
    } catch {
      setLoadError('Erro ao continuar a partida.');
      setPhase('HT');
    }
  }, [matchState, opponent, difficulty]);

  // ── LIVE (2º tempo) → RESULT ───────────────────────────────────────────────
  const handleFullTime = useCallback(() => setTimeout(() => setPhase('RESULT'), 1500), []);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleRematch = useCallback(async () => {
    if (!opponent) return;
    await handleSelectOpponent(opponent.id);
  }, [opponent, handleSelectOpponent]);

  const handleBack = useCallback(() => {
    setOpponent(null);
    setMatchState(null);
    setHalftime(null);
    setFinalData(null);
    setBlockInfo(null);
    setPhase('SELECT');
    router.refresh();
  }, [router]);

  const firstHalfRich = halftime ? buildRichEvents(halftime.events) : [];
  const secondHalfRich = finalData
    ? buildRichEvents(finalData.display.events.filter((e) => e.minute > 45))
    : [];

  return (
    <div
      className="min-h-screen overflow-hidden relative"
      style={{
        background: [
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(185,28,28,0.14) 0%, transparent 55%)',
          'radial-gradient(ellipse 50% 35% at 0% 80%, rgba(220,38,38,0.07) 0%, transparent 50%)',
          '#060810',
        ].join(', '),
      }}
    >
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
              <div className="flex items-center justify-between mb-1">
                <h1 className="font-display text-3xl tracking-wider" style={{ color: '#f87171' }}>
                  PARTIDA
                </h1>
                <a
                  href="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white/35 hover:text-white/65 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Home</span>
                </a>
              </div>
              <p className="text-muted text-xs mt-0.5">Escolha um adversário e viva cada lance</p>
            </div>

            {/* Dificuldade da IA — Sprint 26 */}
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">
                Dificuldade da IA
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(DIFFICULTY_DEFS) as MatchDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={[
                      'py-2 rounded-lg text-[10px] font-bold border transition-colors',
                      difficulty === d
                        ? 'bg-red-900/40 border-red-700/50 text-red-300'
                        : 'border-white/10 text-white/40 hover:text-white/60',
                    ].join(' ')}
                  >
                    {DIFFICULTY_DEFS[d].label}
                  </button>
                ))}
              </div>
              <p className="text-muted text-[9px] mt-1.5">
                {DIFFICULTY_DEFS[difficulty].description}
              </p>
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
            <OpponentPicker
              opponents={MATCH_OPPONENTS}
              userOvr={userOvr}
              onSelect={handleSelectOpponent}
            />
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
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
            <div className="text-center">
              <p className="font-display text-xl gold-text tracking-wider">PREPARANDO</p>
              <p className="text-muted text-xs mt-1">{loadingLabel}</p>
            </div>
          </motion.div>
        )}

        {/* BLOCKED — Prioridade 0 */}
        {phase === 'BLOCKED' && blockInfo && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SquadRequiredScreen {...blockInfo} onBack={handleBack} />
          </motion.div>
        )}

        {/* INTRO */}
        {phase === 'INTRO' && opponent && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            <StadiumIntro opponent={opponent} onComplete={() => setPhase('PRE')} />
          </motion.div>
        )}

        {/* PRE */}
        {phase === 'PRE' && opponent && halftime && (
          <motion.div
            key="pre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-screen"
          >
            <PreMatchScreen
              opponent={opponent}
              userLineup={halftime.homeFieldPlayers}
              userOvr={averageOvr(halftime.homeFieldPlayers)}
              onKickoff={handleStartMatch}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {/* LIVE — 1º ou 2º tempo */}
        {phase === 'LIVE' && opponent && halftime && half === 1 && (
          <motion.div
            key="live1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen"
          >
            <LiveMatchView
              rich={firstHalfRich}
              homeName="Seu Time"
              awayName={`${opponent.flag} ${opponent.name}`}
              startMinute={0}
              endMinuteCap={46}
              initialHomeScore={0}
              initialAwayScore={0}
              paused={false}
              onHalfTime={handleHalfTime}
              onFullTime={() => {}}
            />
          </motion.div>
        )}
        {phase === 'LIVE' && opponent && halftime && half === 2 && finalData && (
          <motion.div
            key="live2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen"
          >
            <LiveMatchView
              rich={secondHalfRich}
              homeName="Seu Time"
              awayName={`${opponent.flag} ${opponent.name}`}
              startMinute={46}
              endMinuteCap={95}
              initialHomeScore={halftime.homeScore}
              initialAwayScore={halftime.awayScore}
              paused={false}
              onHalfTime={() => {}}
              onFullTime={handleFullTime}
            />
          </motion.div>
        )}

        {/* HT — intervalo jogável */}
        {phase === 'HT' && halftime && (
          <motion.div
            key="ht"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            <HalftimeScreen
              halftime={halftime}
              busy={htBusy}
              error={htError}
              onSubstitute={handleSubstitute}
              onChangeTactic={handleChangeTactic}
              onContinue={handleContinue}
            />
          </motion.div>
        )}

        {/* RESULT */}
        {phase === 'RESULT' && finalData && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <MatchResultScreen data={finalData} onRematch={handleRematch} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
