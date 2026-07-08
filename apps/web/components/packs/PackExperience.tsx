'use client';

/**
 * PackExperience — T052
 *
 * Fases (state machine):
 *   SELECT  → escolha do pack (PackSelector)
 *   CHARGE  → toque recebido: vibração + glow crescente (1.4s)
 *   BURST   → flash de explosão + partículas (0.7s)
 *   REVEAL  → cartas aparecem escalonadas, face-down
 *   DONE    → todas reveladas, botões de ação
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { LevelUpModal } from '@/components/ui/LevelUpModal';
import { openPackAction } from '@/lib/actions/packs';
import type { DrawnCardInfo } from '@/lib/actions/packs.types';
import type { CollectionCard } from '@/lib/collection-data';
import { getCollection } from '@/lib/collection-data';
import { vibrate } from '@/lib/haptics';
import { type DrawnCard, PACK_DEFS, type PackDefinitionUI } from '@/lib/pack-logic';
import { deriveAccountProgress } from '@/lib/rewards-data';
import { SFX } from '@/lib/sound-manager';
import { toast } from '@/lib/wl-toast';
import type { RarityCode } from '@world-legends/types';
import { CardRevealScene } from './CardRevealScene';
import { ExplosionOverlay } from './ExplosionOverlay';
import { PackFloatScene } from './PackFloatScene';
import { PackSelector } from './PackSelector';
import { RevealSummary } from './RevealSummary';
import { useCameraShake } from './hooks/useCameraShake';

// ─── Phase types ──────────────────────────────────────────────────────────────

export type Phase = 'SELECT' | 'FLOAT' | 'CHARGE' | 'BURST' | 'REVEAL' | 'DONE';

// ─── Visual maps ──────────────────────────────────────────────────────────────

const GLOW_MAP: Record<RarityCode, string> = {
  common: 'rgba(107,114,128,0.5)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(37,99,235,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,1)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

const PARTICLE_MAP: Record<RarityCode, string> = {
  common: '#6b7280',
  rare: '#a855f7',
  elite: '#3b82f6',
  legendary: '#c9a84c',
  ultra: '#ec4899',
  world_cup_hero: '#e2e8f0',
};

type RevealEffect = 'common' | 'rare' | 'elite' | 'legendary' | 'ultra' | 'world_cup_hero';

const EFFECT_MAP: Record<RarityCode, RevealEffect> = {
  common: 'common',
  rare: 'rare',
  elite: 'elite',
  legendary: 'legendary',
  ultra: 'ultra',
  world_cup_hero: 'world_cup_hero',
};

/** Converte resposta do servidor em DrawnCard[] para animação de reveal */
function buildDrawnCardsFromServer(
  drawn: DrawnCardInfo[],
  allCards: CollectionCard[],
): DrawnCard[] {
  const cardMap = new Map(allCards.map((c) => [c.cardId as string, c]));
  const byRarity = new Map<RarityCode, CollectionCard[]>();
  for (const c of allCards) {
    const list = byRarity.get(c.rarityCode) ?? [];
    list.push(c);
    byRarity.set(c.rarityCode, list);
  }

  return drawn.map((d, i) => {
    const card = cardMap.get(d.cardId) ?? byRarity.get(d.rarityCode)?.[0] ?? allCards[0]!;
    return {
      index: i,
      card: { ...card, userCardId: d.userCardId },
      effect: EFFECT_MAP[d.rarityCode],
      wasForced: false,
      isDuplicate: d.isDuplicate,
      fragmentsGained: d.fragmentsGained,
      glowColor: GLOW_MAP[d.rarityCode],
      particleColor: PARTICLE_MAP[d.rarityCode],
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  initialBalance?: number;
  initialFragments?: number;
  isWelcome?: boolean;
  initialWins?: number;
  initialDraws?: number;
  initialCollectionCount?: number;
};

export function PackExperience({
  initialBalance = 500,
  initialFragments = 0,
  isWelcome = false,
  initialWins = 0,
  initialDraws = 0,
  initialCollectionCount = 0,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('SELECT');
  const [pack, setPack] = useState<PackDefinitionUI | null>(null);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [balance, setBalance] = useState(initialBalance);
  const [fragments, setFragments] = useState(initialFragments);
  const [totalFragmentsGained, setTotalFragmentsGained] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [collectionCount, setCollectionCount] = useState(initialCollectionCount);
  const [levelUpInfo, setLevelUpInfo] = useState<{ prevLevel: number; level: number } | null>(null);

  const { elRef: shakeRef, shake } = useCameraShake();

  // Promessa do servidor — criada no CHARGE, aguardada no BURST
  const pendingOpenRef = useRef<ReturnType<typeof openPackAction> | null>(null);

  // Auto-limpar erro de saldo insuficiente após 3s
  useEffect(() => {
    if (!insufficientFunds) return;
    const t = setTimeout(() => setInsufficientFunds(false), 3000);
    return () => clearTimeout(t);
  }, [insufficientFunds]);

  // ── Toque no pack → CHARGE imediatamente ─────────────────────────────────────
  const handleChoosePack = useCallback(
    (p: PackDefinitionUI) => {
      if (balance < p.price) {
        setInsufficientFunds(true);
        vibrate('packSelect');
        return;
      }
      setInsufficientFunds(false);
      setPack(p);
      setCards([]);
      setPhase('CHARGE');

      // Otimista: debitar saldo localmente para resposta imediata na UI
      setBalance((b) => b - p.price);
      vibrate('packCharge');
      SFX.packCharge();

      // Iniciar server action em paralelo com a animação (1.4s charge + 0.7s burst)
      pendingOpenRef.current = openPackAction(p.id);

      setTimeout(() => {
        setPhase('BURST');
        SFX.packOpen();
        shake(14, 550);
        vibrate('packOpen');
      }, 1400);
    },
    [balance, shake],
  );

  // ── BURST → REVEAL ───────────────────────────────────────────────────────────
  const handleBurstComplete = useCallback(() => {
    if (!pack) return;

    const pending = pendingOpenRef.current;
    pendingOpenRef.current = null;

    if (!pending) {
      toast.error('Erro ao abrir pack. Tente novamente.');
      setPhase('SELECT');
      return;
    }

    pending
      .then((result) => {
        if (result.ok) {
          setBalance(result.newBalance);
          if (result.totalFragments > 0) {
            setFragments((f) => f + result.totalFragments);
            setTotalFragmentsGained(result.totalFragments);
          } else {
            setTotalFragmentsGained(0);
          }
          const allCards = getCollection();
          const drawn = buildDrawnCardsFromServer(result.drawn, allCards);
          setCards(drawn);
          setPhase('REVEAL');

          // Novas cartas (não-duplicatas) aumentam a coleção → pode subir de
          // nível. Nível é derivado (ver lib/rewards-data.ts), então basta
          // comparar antes/depois com o mesmo cálculo usado em Home/Perfil.
          const newUniqueCards = result.drawn.filter((d) => !d.isDuplicate).length;
          setCollectionCount((prevCount) => {
            const nextCount = prevCount + newUniqueCards;
            const prevProgress = deriveAccountProgress({
              wins: initialWins,
              draws: initialDraws,
              collectionCount: prevCount,
            });
            const nextProgress = deriveAccountProgress({
              wins: initialWins,
              draws: initialDraws,
              collectionCount: nextCount,
            });
            if (nextProgress.level > prevProgress.level) {
              setLevelUpInfo({ prevLevel: prevProgress.level, level: nextProgress.level });
            }
            return nextCount;
          });
        } else {
          setBalance((b) => b + pack.price);
          toast.error(result.error ?? 'Erro ao abrir pack. Tente novamente.');
          setPhase('SELECT');
        }
      })
      .catch((e: unknown) => {
        setBalance((b) => b + pack.price);
        const msg = e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.';
        toast.error(msg);
        setPhase('SELECT');
      });
  }, [pack]);

  // ── Todas reveladas → DONE ──────────────────────────────────────────────────
  const handleAllFlipped = useCallback(() => {
    setTimeout(() => setPhase('DONE'), 600);
  }, []);

  // ── Abrir outro do mesmo pack ───────────────────────────────────────────────
  const handleOpenAnother = useCallback(() => {
    if (!pack) {
      setPhase('SELECT');
      return;
    }
    handleChoosePack(pack);
  }, [pack, handleChoosePack]);

  // ── Voltar à seleção ────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setCards([]);
    setPack(null);
    setPhase('SELECT');
    // Refresh server data (balance, missions) sem bloquear o fluxo
    router.refresh();
  }, [router]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={shakeRef}
      className="relative min-h-screen overflow-hidden select-none"
      style={{
        willChange: 'transform',
        background: [
          'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(201,168,76,0.14) 0%, transparent 55%)',
          'radial-gradient(ellipse 45% 30% at 0% 60%, rgba(180,130,30,0.07) 0%, transparent 50%)',
          'radial-gradient(ellipse 50% 35% at 100% 80%, rgba(201,168,76,0.06) 0%, transparent 55%)',
          '#050508',
        ].join(', '),
      }}
    >
      <AnimatePresence>
        {phase === 'BURST' && pack && (
          <ExplosionOverlay
            packColor={pack.borderColor}
            packGlow={pack.glowColor}
            onComplete={handleBurstComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === 'SELECT' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="px-4 py-6"
          >
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="font-display text-3xl gold-text tracking-wider">PACKS</h1>
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
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Home</span>
                </a>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-muted text-xs">Toque no pack para abrir</p>
                <div className="glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-3">
                  <span>
                    <span className="gold-text font-bold">{balance.toLocaleString('pt-BR')}c</span>
                  </span>
                  {fragments > 0 && (
                    <span>
                      <span className="text-purple-400 font-bold">
                        {fragments.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-muted ml-0.5">frags</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Erro de saldo insuficiente */}
              <AnimatePresence>
                {insufficientFunds && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 rounded-xl px-4 py-2.5 text-xs font-bold text-center"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.35)',
                      color: '#f87171',
                    }}
                  >
                    Créditos insuficientes para abrir este pack
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <PackSelector packs={PACK_DEFS} balance={balance} onOpen={handleChoosePack} />
          </motion.div>
        )}

        {(phase === 'FLOAT' || phase === 'CHARGE') && pack && (
          <motion.div
            key="float"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <PackFloatScene pack={pack} phase={phase} onTap={() => {}} onBack={handleBack} />
          </motion.div>
        )}

        {phase === 'REVEAL' && cards.length > 0 && pack && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <CardRevealScene
              cards={cards}
              pack={pack}
              onAllFlipped={handleAllFlipped}
              onShake={shake}
            />
          </motion.div>
        )}

        {phase === 'DONE' && pack && cards.length > 0 && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="px-4 py-6"
          >
            <RevealSummary
              cards={cards}
              pack={pack}
              fragmentsGained={totalFragmentsGained}
              onOpenAnother={handleOpenAnother}
              onBack={handleBack}
              isWelcome={isWelcome}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <LevelUpModal
        open={phase === 'DONE' && levelUpInfo !== null}
        prevLevel={levelUpInfo?.prevLevel ?? 1}
        level={levelUpInfo?.level ?? 1}
        onDismiss={() => setLevelUpInfo(null)}
      />
    </div>
  );
}
