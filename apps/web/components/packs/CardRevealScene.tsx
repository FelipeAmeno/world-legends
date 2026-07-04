'use client';

import type { RevealEffect } from '@/lib/pack-logic';
import type { DrawnCard, PackDefinitionUI } from '@/lib/pack-logic';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { ConfettiCanvas } from './ConfettiCanvas';
import { GoatReveal } from './GoatReveal';
import { RevealedCard } from './RevealedCard';

const HIGH_RARITY_CONFETTI = new Set<RevealEffect>(['legendary', 'ultra', 'world_cup_hero']);

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

  // Checar se há uma GOAT card
  const goatCard = cards.find((c) => c.effect === 'world_cup_hero');
  const goatIdx = goatCard ? cards.indexOf(goatCard) : null;

  // Suspense beat: 0.6s de escuridão antes das cartas entrarem
  useEffect(() => {
    const tCards = setTimeout(() => setShowCards(true), 600);
    const tRevAll = setTimeout(() => setShowRevAll(true), 2200);
    return () => { clearTimeout(tCards); clearTimeout(tRevAll); };
  }, []);

  // Detectar conclusão
  useEffect(() => {
    const allFlipped = flipped.size === cards.length;
    const goatPending = goatIdx !== null && !goatDone;
    if (allFlipped && !goatPending) onAllFlipped();
  }, [flipped, cards.length, goatIdx, goatDone, onAllFlipped]);

  // Confetti sai após 2.5s
  useEffect(() => {
    if (!confettiRarity) return;
    const t = setTimeout(() => setConfettiRarity(null), 2500);
    return () => clearTimeout(t);
  }, [confettiRarity]);

  const handleFlip = useCallback(
    (idx: number) => {
      // Carta GOAT → mostrar tela especial
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
      if (HIGH_RARITY_CONFETTI.has(effect)) {
        setConfettiRarity(effect);
      }
      if (effect === 'legendary') onShake?.(10, 450);
      if (effect === 'ultra') onShake?.(16, 600);
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

  const remaining = cards.length - flipped.size;

  return (
    <>
      {/* Confetti para raridade alta */}
      <AnimatePresence>
        {confettiRarity && <ConfettiCanvas key={confettiRarity} rarity={confettiRarity} />}
      </AnimatePresence>

      {/* Tela de revelação GOAT */}
      <AnimatePresence>
        {goatIndex !== null && (
          <GoatReveal card={cards[goatIndex]!} onComplete={handleGoatComplete} />
        )}
      </AnimatePresence>

      {/* Cena principal */}
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

        {/* Background glow pulsante */}
        <motion.div
          className="fixed inset-0 pointer-events-none -z-10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${pack.glowColor.replace(/[\d.]+\)$/, '0.12)')}, transparent)`,
          }}
        />

        {/* Suspense flash antes das cartas — pulso de glow */}
        <AnimatePresence>
          {!showCards && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                background: `radial-gradient(ellipse 50% 30% at 50% 50%, ${pack.glowColor}, transparent)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Grade de cartas */}
        <div className="flex flex-wrap justify-center gap-4 max-w-sm">
          {cards.map((drawn, i) => (
            <motion.div
              key={drawn.card.cardId + i}
              initial={{ opacity: 0, y: 90, scale: 0.55, rotateX: 25 }}
              animate={showCards ? { opacity: 1, y: 0, scale: 1, rotateX: 0 } : { opacity: 0, y: 90, scale: 0.55, rotateX: 25 }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 18,
                delay: showCards ? 0.05 + i * 0.10 : 0,
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

        {/* Botão Revelar Tudo / celebração final */}
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
                background: `linear-gradient(135deg,${pack.glowColor.replace(/[\d.]+\)$/,'0.15)')},${pack.glowColor.replace(/[\d.]+\)$/,'0.08)')})`,
                border: `1px solid ${pack.borderColor.replace(/[\d.]+\)$/,'0.5)')}`,
                color: pack.borderColor.replace(/[\d.]+\)$/,'1)'),
                boxShadow: `0 0 12px ${pack.glowColor.replace(/[\d.]+\)$/,'0.2)')}`,
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
