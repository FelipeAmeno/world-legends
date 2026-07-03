'use client';

/**
 * PackExperience — T052
 *
 * Fases (state machine):
 *   SELECT  → escolha do pack (PackSelector)
 *   FLOAT   → pack flutuando com Framer Motion, aguardando toque
 *   CHARGE  → toque recebido: vibração + glow crescente (1.4s)
 *   BURST   → flash de explosão + partículas (0.7s)
 *   REVEAL  → cartas aparecem escalonadas, face-down
 *   DONE    → todas reveladas, botões de ação
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

import type { DrawnCardInfo } from '@/lib/actions';
import { openPackAction } from '@/lib/actions';
import type { CollectionCard } from '@/lib/collection-data';
import { getCollection } from '@/lib/collection-data';
import { type DrawnCard, PACK_DEFS, type PackDefinitionUI, drawPack } from '@/lib/pack-logic';
import type { RarityCode } from '@world-legends/types';
import { CardRevealScene } from './CardRevealScene';
import { ExplosionOverlay } from './ExplosionOverlay';
import { PackFloatScene } from './PackFloatScene';
import { PackSelector } from './PackSelector';
import { RevealSummary } from './RevealSummary';

// ─── Phase types ──────────────────────────────────────────────────────────────

export type Phase = 'SELECT' | 'FLOAT' | 'CHARGE' | 'BURST' | 'REVEAL' | 'DONE';

// ─── Visual maps (duplication intencional — evita export de internals de pack-logic) ─────

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
      glowColor: GLOW_MAP[d.rarityCode],
      particleColor: PARTICLE_MAP[d.rarityCode],
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  initialBalance?: number;
};

export function PackExperience({ initialBalance = 500 }: Props) {
  const [phase, setPhase] = useState<Phase>('SELECT');
  const [pack, setPack] = useState<PackDefinitionUI | null>(null);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [balance, setBalance] = useState(initialBalance);
  const [seed, setSeed] = useState(Date.now());
  const [selected, setSelected] = useState<PackDefinitionUI | null>(null);

  // Promessa do servidor — criada no CHARGE, aguardada no BURST
  const pendingOpenRef = useRef<ReturnType<typeof openPackAction> | null>(null);

  // ── Selecionar pack e ir para FLOAT ──────────────────────────────────────────
  const handleChoosePack = useCallback(
    (p: PackDefinitionUI) => {
      if (balance < p.price) return;
      setPack(p);
      setSeed((s) => s + 1);
      setPhase('FLOAT');
    },
    [balance],
  );

  // ── Toque no pack → CHARGE ──────────────────────────────────────────────────
  const handlePackTap = useCallback(() => {
    if (phase !== 'FLOAT' || !pack) return;
    setPhase('CHARGE');

    // Otimista: debitar saldo localmente para resposta imediata na UI
    setBalance((b) => b - pack.price);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 80, 20, 120]);
    }

    // Iniciar server action em paralelo com a animação (1.4s charge + 0.7s burst)
    pendingOpenRef.current = openPackAction(pack.id);

    setTimeout(() => setPhase('BURST'), 1400);
  }, [phase, pack]);

  // ── BURST → REVEAL ───────────────────────────────────────────────────────────
  const handleBurstComplete = useCallback(() => {
    if (!pack) return;

    const pending = pendingOpenRef.current;
    pendingOpenRef.current = null;

    const fallback = () => {
      const drawn = drawPack(pack, seed);
      setCards(drawn);
      setPhase('REVEAL');
    };

    if (!pending) {
      fallback();
      return;
    }

    pending
      .then((result) => {
        if (result.ok) {
          // Usar saldo autoritativo do servidor
          setBalance(result.newBalance);
          const allCards = getCollection();
          const drawn = buildDrawnCardsFromServer(result.drawn, allCards);
          setCards(drawn);
          setPhase('REVEAL');
        } else {
          // Estornar debit otimista
          setBalance((b) => b + pack.price);
          console.error('Erro ao abrir pack:', result.error);
          fallback();
        }
      })
      .catch((e: unknown) => {
        // Estornar debit otimista
        setBalance((b) => b + pack.price);
        console.error('Exceção ao abrir pack:', e);
        fallback();
      });
  }, [pack, seed]);

  // ── Todas reveladas → DONE ──────────────────────────────────────────────────
  const handleAllFlipped = useCallback(() => {
    setTimeout(() => setPhase('DONE'), 600);
  }, []);

  // ── Abrir outro do mesmo pack ───────────────────────────────────────────────
  const handleOpenAnother = useCallback(() => {
    if (!pack || balance < pack.price) {
      setPhase('SELECT');
      return;
    }
    setSeed((s) => s + 1);
    setCards([]);
    setPhase('FLOAT');
  }, [pack, balance]);

  // ── Voltar à seleção ────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setCards([]);
    setPack(null);
    setPhase('SELECT');
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-hidden hero-bg select-none">
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
              <h1 className="font-display text-3xl gold-text tracking-wider">PACKS</h1>
              <div className="flex items-center justify-between mt-1">
                <p className="text-muted text-xs">Escolha seu pack e descubra as lendas</p>
                <div className="glass rounded-lg px-3 py-1.5 text-xs">
                  <span className="gold-text font-bold">{balance.toLocaleString('pt-BR')}c</span>
                  <span className="text-muted ml-1">saldo</span>
                </div>
              </div>
            </div>

            <PackSelector
              packs={PACK_DEFS}
              selected={selected}
              balance={balance}
              onSelect={setSelected}
              onOpen={() => selected && handleChoosePack(selected)}
            />
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
            <PackFloatScene pack={pack} phase={phase} onTap={handlePackTap} onBack={handleBack} />
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
            <CardRevealScene cards={cards} pack={pack} onAllFlipped={handleAllFlipped} />
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
              onOpenAnother={handleOpenAnother}
              onBack={handleBack}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
