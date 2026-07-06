'use client';

import type { RevealEffect } from '@/lib/pack-logic';
import type { DrawnCard, PackDefinitionUI } from '@/lib/pack-logic';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { ConfettiCanvas } from './ConfettiCanvas';
import { GoatReveal } from './GoatReveal';
import { RevealedCard } from './RevealedCard';

const HIGH_RARITY_CONFETTI = new Set<RevealEffect>(['legendary', 'ultra', 'world_cup_hero']);

// Color that floods the background after a high-rarity reveal
const RARITY_FLOOD: Partial<Record<RevealEffect, string>> = {
  legendary: 'rgba(201,168,76,0.18)',
  ultra: 'rgba(236,72,153,0.22)',
};

type Props = {
  cards: DrawnCard[];
  pack: PackDefinitionUI;
  onAllFlipped: () => void;
  onShake?: (intensity?: number, duration?: number) => void;
};

export function CardRevealScene({ cards, pack, onAllFlipped, onShake }: Props) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [showRevAll, setShowRevAll] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [goatIndex, setGoatIndex] = useState<number | null>(null);
  const [goatDone, setGoatDone] = useState(false);
  const [confettiRarity, setConfettiRarity] = useState<RevealEffect | null>(null);

  // Intro sequence states
  const [revealFlash, setRevealFlash] = useState(true);
  const [showRevealText, setShowRevealText] = useState(false);

  // Rarity flood — background color reacts when a big card flips
  const [rarityFlood, setRarityFlood] = useState<string | null>(null);

  const goatCard = cards.find((c) => c.effect === 'world_cup_hero');
  const goatIdx = goatCard ? cards.indexOf(goatCard) : null;

  // ── Intro sequence (0–600ms) ──────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setRevealFlash(false), 320);
    const t2 = setTimeout(() => setShowRevealText(true), 150);
    const t3 = setTimeout(() => setShowRevealText(false), 560);
    const tCards = setTimeout(() => setShowCards(true), 600);
    const tRevAll = setTimeout(() => setShowRevAll(true), 2200);

    return () => [t1, t2, t3, tCards, tRevAll].forEach(clearTimeout);
  }, []);

  // ── Detect all cards flipped ───────────────────────────────────────────────
  useEffect(() => {
    const allFlipped = flipped.size === cards.length;
    const goatPending = goatIdx !== null && !goatDone;
    if (allFlipped && !goatPending) onAllFlipped();
  }, [flipped, cards.length, goatIdx, goatDone, onAllFlipped]);

  // ── Confetti auto-clear ────────────────────────────────────────────────────
  useEffect(() => {
    if (!confettiRarity) return;
    const t = setTimeout(() => setConfettiRarity(null), 2500);
    return () => clearTimeout(t);
  }, [confettiRarity]);

  // ── Rarity flood auto-clear ────────────────────────────────────────────────
  useEffect(() => {
    if (!rarityFlood) return;
    const t = setTimeout(() => setRarityFlood(null), 1600);
    return () => clearTimeout(t);
  }, [rarityFlood]);

  const handleFlip = useCallback(
    (idx: number) => {
      if (idx === goatIdx && !goatDone) {
        setGoatIndex(idx);
        return;
      }
      setFlipped((prev) => new Set([...prev, idx]));
    },
    [goatIdx, goatDone],
  );

  const handleHighRarity = useCallback(
    (effect: RevealEffect) => {
      if (HIGH_RARITY_CONFETTI.has(effect)) setConfettiRarity(effect);
      if (effect === 'legendary') {
        onShake?.(10, 450);
        setRarityFlood(RARITY_FLOOD.legendary!);
      }
      if (effect === 'ultra') {
        onShake?.(16, 600);
        setRarityFlood(RARITY_FLOOD.ultra!);
      }
    },
    [onShake],
  );

  const handleRevealAll = useCallback(() => {
    setFlipped(new Set(cards.map((_, i) => i)));
    if (goatIdx !== null && !goatDone) setGoatIndex(goatIdx);
  }, [cards, goatIdx, goatDone]);

  const handleGoatComplete = useCallback(() => {
    setGoatDone(true);
    setGoatIndex(null);
    setFlipped((prev) => new Set([...prev, goatIdx!]));
  }, [goatIdx]);

  // ── Auto-reveal: flip all cards 1.2s after they appear ───────────────────
  useEffect(() => {
    if (!showCards) return;
    const t = setTimeout(handleRevealAll, 1200);
    return () => clearTimeout(t);
  }, [showCards, handleRevealAll]);

  const remaining = cards.length - flipped.size;

  return (
    <>
      {/* Confetti para raridade alta */}
      <AnimatePresence>
        {confettiRarity && <ConfettiCanvas key={confettiRarity} rarity={confettiRarity} />}
      </AnimatePresence>

      {/* Tela GOAT */}
      <AnimatePresence>
        {goatIndex !== null && (
          <GoatReveal card={cards[goatIndex]!} onComplete={handleGoatComplete} />
        )}
      </AnimatePresence>

      {/* ── Intro: flash de abertura ── */}
      <AnimatePresence>
        {revealFlash && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{
              background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${pack.glowColor}, rgba(255,255,255,0.25), transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Intro: REVELANDO... ── */}
      <AnimatePresence>
        {showRevealText && !showCards && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.2 }}
          >
            <motion.p
              className="font-display tracking-[0.55em] uppercase"
              style={{
                fontSize: 28,
                background: `linear-gradient(90deg, ${pack.glowColor.replace(/[\d.]+\)$/, '1)')}, #fff, ${pack.glowColor.replace(/[\d.]+\)$/, '1)')})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 18px ${pack.glowColor})`,
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.28, repeat: Number.POSITIVE_INFINITY }}
            >
              REVELANDO
            </motion.p>

            {/* Three pulsing dots */}
            <div className="flex gap-2 mt-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: pack.glowColor.replace(/[\d.]+\)$/, '1)') }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] }}
                  transition={{ duration: 0.5, delay: i * 0.15, repeat: Number.POSITIVE_INFINITY }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rarity flood background ── */}
      <AnimatePresence>
        {rarityFlood && (
          <motion.div
            className="fixed inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, exit: { duration: 1.2 } }}
            style={{
              background: `radial-gradient(ellipse 85% 65% at 50% 40%, ${rarityFlood}, transparent)`,
              zIndex: 5,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Cena principal ── */}
      <div className="min-h-screen flex flex-col items-center px-4 py-6 gap-6">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="font-display text-2xl text-parchment tracking-wider">
            {pack.name.toUpperCase()}
          </p>
          <p className="text-muted text-xs mt-0.5">
            {remaining > 0
              ? `${remaining} carta${remaining > 1 ? 's' : ''} para revelar`
              : '✨ Pack revelado!'}
          </p>
        </motion.div>

        {/* Background glow */}
        <motion.div
          className="fixed inset-0 pointer-events-none -z-10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${pack.glowColor.replace(/[\d.]+\)$/, '0.12)')}, transparent)`,
          }}
        />

        {/* Grade de cartas */}
        <div className="relative z-10 flex flex-wrap justify-center gap-4 max-w-sm">
          {cards.map((drawn, i) => (
            <motion.div
              key={drawn.card.cardId + i}
              initial={{ opacity: 0, y: 90, scale: 0.55, rotateX: 25 }}
              animate={
                showCards
                  ? { opacity: 1, y: 0, scale: 1, rotateX: 0 }
                  : { opacity: 0, y: 90, scale: 0.55, rotateX: 25 }
              }
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 18,
                delay: showCards ? 0.05 + i * 0.1 : 0,
              }}
            >
              <RevealedCard
                drawn={drawn}
                flipped={flipped.has(i)}
                onFlip={() => handleFlip(i)}
                onHighRarity={handleHighRarity}
              />
            </motion.div>
          ))}
        </div>

        {/* Barra de progresso */}
        <motion.div
          className="w-56 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${pack.glowColor}, ${pack.borderColor})` }}
            initial={{ width: '0%' }}
            animate={{ width: `${(flipped.size / cards.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </motion.div>

        {/* Revelar Tudo / celebração final */}
        <AnimatePresence mode="wait">
          {remaining === 0 ? (
            <motion.div
              key="done"
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <span style={{ fontSize: 22 }}>✨</span>
              <p className="font-display text-sm tracking-widest text-gold">PACK REVELADO</p>
            </motion.div>
          ) : showRevAll && remaining > 1 ? (
            <motion.button
              key="revall"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleRevealAll}
              className="px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: `linear-gradient(135deg,${pack.glowColor.replace(/[\d.]+\)$/, '0.15)')},${pack.glowColor.replace(/[\d.]+\)$/, '0.08)')})`,
                border: `1px solid ${pack.borderColor.replace(/[\d.]+\)$/, '0.5)')}`,
                color: pack.borderColor.replace(/[\d.]+\)$/, '1)'),
                boxShadow: `0 0 12px ${pack.glowColor.replace(/[\d.]+\)$/, '0.2)')}`,
              }}
            >
              Revelar todas ({remaining}) →
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
