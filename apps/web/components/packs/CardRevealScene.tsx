'use client';

import type { RevealEffect } from '@/lib/pack-logic';
import type { DrawnCard, PackDefinitionUI } from '@/lib/pack-logic';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfettiCanvas } from './ConfettiCanvas';
import { GoatReveal } from './GoatReveal';
import { LightBirth } from './LightBirth';
import { RevealedCard } from './RevealedCard';

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITY_ORDER: Record<RevealEffect, number> = {
  common: 0,
  rare: 1,
  elite: 2,
  legendary: 3,
  ultra: 4,
  world_cup_hero: 5,
};

// Milliseconds of face-down suspense before auto-flip
const FACEDOWN_DELAY: Record<RevealEffect, number> = {
  common: 600,
  rare: 950,
  elite: 1400,
  legendary: 2400,
  ultra: 3200,
  world_cup_hero: 400,
};

// Time after flip animation completes to admire the card before advancing
const ADMIRE_DELAY: Record<RevealEffect, number> = {
  common: 1600,
  rare: 2000,
  elite: 2300,
  legendary: 3200,
  ultra: 3800,
  world_cup_hero: 0,
};

// Approximate total flip animation time (anticipation + flip)
const FLIP_ANIM_MS: Record<RevealEffect, number> = {
  common: 700,
  rare: 800,
  elite: 900,
  legendary: 1700,
  ultra: 2200,
  world_cup_hero: 0,
};

const RARITY_FLOOD: Partial<Record<RevealEffect, string>> = {
  legendary: 'rgba(201,168,76,0.22)',
  ultra: 'rgba(236,72,153,0.26)',
};

// Back face glow / ring color per rarity (shown while face-down)
const BACK_PULSE: Record<RevealEffect, { border: string; glow: string; bg: string }> = {
  common: { border: 'rgba(107,114,128,0.5)', glow: 'rgba(107,114,128,0.2)', bg: '#0c0d0f' },
  rare: { border: 'rgba(147,51,234,0.7)', glow: 'rgba(147,51,234,0.35)', bg: '#0a0018' },
  elite: { border: 'rgba(59,130,246,0.8)', glow: 'rgba(59,130,246,0.4)', bg: '#000d20' },
  legendary: { border: 'rgba(201,168,76,1)', glow: 'rgba(201,168,76,0.55)', bg: '#150b00' },
  ultra: { border: 'rgba(236,72,153,1)', glow: 'rgba(236,72,153,0.6)', bg: '#1a0015' },
  world_cup_hero: { border: 'rgba(240,244,255,1)', glow: 'rgba(240,244,255,0.6)', bg: '#04040a' },
};

// Label shown while face-down (higher rarities only)
const MYSTERY_LABEL: Partial<Record<RevealEffect, string>> = {
  elite: '⚡ ELITE',
  legendary: '✦ LENDÁRIO ✦',
  ultra: '✦✦ ULTRA RARO ✦✦',
  world_cup_hero: '?!',
};

// ─── Phase type ───────────────────────────────────────────────────────────────

type CardPhase = 'entering' | 'facedown' | 'revealed';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  cards: DrawnCard[];
  pack: PackDefinitionUI;
  onAllFlipped: () => void;
  onShake?: (intensity?: number, duration?: number) => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CardRevealScene({ cards, pack, onAllFlipped, onShake }: Props) {
  // Sort ascending: common first → rarest last
  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => RARITY_ORDER[a.effect] - RARITY_ORDER[b.effect]),
    [cards],
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<CardPhase>('entering');
  const [flipped, setFlipped] = useState(false);
  const [confettiRarity, setConfettiRarity] = useState<RevealEffect | null>(null);
  const [rarityFlood, setRarityFlood] = useState<string | null>(null);
  const [goatActive, setGoatActive] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = sortedCards[currentIdx];
  const totalCards = sortedCards.length;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Advance to next card ──────────────────────────────────────────────────
  const goNext = useCallback(() => {
    clearTimer();
    if (currentIdx >= totalCards - 1) {
      setTimeout(onAllFlipped, 500);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setPhase('entering');
    setFlipped(false);
  }, [currentIdx, totalCards, onAllFlipped, clearTimer]);

  // ── Trigger flip ─────────────────────────────────────────────────────────
  const doFlip = useCallback(() => {
    if (!card || flipped) return;
    clearTimer();

    if (card.effect === 'world_cup_hero') {
      setGoatActive(true);
      return;
    }

    setFlipped(true);
    setPhase('revealed');

    // Camera shake + rarity flood on high rarity
    if (card.effect === 'legendary') {
      onShake?.(10, 500);
      setRarityFlood(RARITY_FLOOD.legendary!);
      setTimeout(() => setRarityFlood(null), 1800);
    }
    if (card.effect === 'ultra') {
      onShake?.(18, 650);
      setRarityFlood(RARITY_FLOOD.ultra!);
      setTimeout(() => setRarityFlood(null), 2000);
    }
    if (card.effect === 'legendary' || card.effect === 'ultra') {
      setConfettiRarity(card.effect);
      setTimeout(() => setConfettiRarity(null), 2800);
    }

    // Auto-advance after flip animation + admire time
    const advanceAfter = FLIP_ANIM_MS[card.effect] + ADMIRE_DELAY[card.effect];
    timerRef.current = setTimeout(goNext, advanceAfter);
  }, [card, flipped, onShake, goNext, clearTimer]);

  // ── GoatReveal complete ───────────────────────────────────────────────────
  const handleGoatDone = useCallback(() => {
    setGoatActive(false);
    setFlipped(true);
    setPhase('revealed');
    setConfettiRarity('world_cup_hero');
    setTimeout(() => setConfettiRarity(null), 3000);
    timerRef.current = setTimeout(goNext, 2500);
  }, [goNext]);

  // ── entering → facedown (400ms enter animation) ──────────────────────────
  useEffect(() => {
    if (phase !== 'entering') return;
    timerRef.current = setTimeout(() => {
      setPhase('facedown');
    }, 400);
    return clearTimer;
  }, [phase, currentIdx, clearTimer]);

  // ── facedown → auto-flip ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'facedown' || !card) return;
    timerRef.current = setTimeout(doFlip, FACEDOWN_DELAY[card.effect]);
    return clearTimer;
  }, [phase, card, doFlip, clearTimer]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer],
  );

  // ── Tap handler: skip to next phase ──────────────────────────────────────
  const handleTap = useCallback(() => {
    if (goatActive) return;
    if (phase === 'facedown' && !flipped) {
      doFlip();
      return;
    }
    if (phase === 'revealed' && flipped) {
      goNext();
    }
  }, [phase, flipped, goatActive, doFlip, goNext]);

  if (!card) return null;

  const back = BACK_PULSE[card.effect];
  const label = MYSTERY_LABEL[card.effect];
  const isHighRarity = card.effect === 'legendary' || card.effect === 'ultra';

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: tap to advance
    <div
      className="min-h-screen flex flex-col items-center justify-between px-4 py-6 relative overflow-hidden select-none"
      onClick={handleTap}
      style={{ cursor: phase === 'entering' ? 'default' : 'pointer' }}
    >
      {/* ── Confetti ── */}
      <AnimatePresence>
        {confettiRarity && <ConfettiCanvas key={confettiRarity} rarity={confettiRarity} />}
      </AnimatePresence>

      {/* ── GoatReveal modal ── */}
      <AnimatePresence>
        {goatActive && card.effect === 'world_cup_hero' && (
          <GoatReveal card={card} onComplete={handleGoatDone} />
        )}
      </AnimatePresence>

      {/* ── Rarity flood background ── */}
      <AnimatePresence>
        {rarityFlood && (
          <motion.div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 85% 65% at 50% 40%, ${rarityFlood}, transparent)`,
              zIndex: 5,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, exit: { duration: 1.4 } }}
          />
        )}
      </AnimatePresence>

      {/* ── Pack glow background ── */}
      <motion.div
        className="fixed inset-0 pointer-events-none -z-10"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        style={{
          background: `radial-gradient(ellipse 65% 45% at 50% 50%, ${pack.glowColor.replace(/[\d.]+\)$/, '0.14)')}, transparent)`,
        }}
      />

      {/* ── Header: pack name + progress ── */}
      <motion.div
        className="text-center z-10 w-full"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="font-display text-xl text-parchment tracking-wider mb-1">
          {pack.name.toUpperCase()}
        </p>

        {/* Dot progress indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {sortedCards.map((c, i) => (
            <motion.div
              key={c.card.cardId + i}
              className="rounded-full"
              animate={{
                width: i === currentIdx ? 20 : 6,
                height: 6,
                opacity: i < currentIdx ? 0.35 : i === currentIdx ? 1 : 0.2,
                background:
                  i < currentIdx
                    ? '#6b7280'
                    : i === currentIdx
                      ? pack.borderColor.replace(/[\d.]+\)$/, '1)')
                      : 'rgba(255,255,255,0.2)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <p className="text-white/30 text-[10px] mt-1.5 tracking-widest uppercase">
          {currentIdx + 1} / {totalCards}
        </p>
      </motion.div>

      {/* ── Card area (single card, centered) ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        {/* Rarity halo behind card */}
        <AnimatePresence>
          {(phase === 'facedown' || phase === 'revealed') && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 240,
                height: 320,
                background: `radial-gradient(ellipse at center, ${back.glow}, transparent 70%)`,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: isHighRarity ? [0.6, 1, 0.6] : 0.7, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={
                isHighRarity
                  ? { duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }
                  : { duration: 0.4 }
              }
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            className="relative flex flex-col items-center"
            initial={{ y: 80, opacity: 0, scale: 0.75 }}
            animate={{ y: 0, opacity: 1, scale: 1.35 }}
            exit={{ y: -60, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            {/* Mystery label (shown face-down for higher rarities) */}
            <AnimatePresence>
              {phase === 'facedown' && label && (
                <motion.div
                  className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none"
                  initial={{ opacity: 0, y: 6, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full"
                    style={{
                      color: back.border,
                      background: `${back.glow}`,
                      border: `1px solid ${back.border}`,
                      boxShadow: `0 0 14px ${back.glow}`,
                    }}
                  >
                    {label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The actual card (RevealedCard handles its own flip animation) */}
            <RevealedCard drawn={card} flipped={flipped} onFlip={doFlip} onHighRarity={() => {}} />

            {/* "Carta nasce da luz" (Sprint 22, item 10) — núcleo de luz por
                cima da carta no instante do flip, que recua e desvanece pra
                revelar a carta "nascendo" de dentro dele. */}
            {phase === 'revealed' && flipped && (
              <div className="absolute inset-0 pointer-events-none">
                <LightBirth key={currentIdx} color={back.border} />
              </div>
            )}

            {/* Tap hint */}
            <AnimatePresence>
              {phase === 'facedown' && !flipped && (
                <motion.p
                  className="absolute -bottom-9 text-[9px] tracking-[0.25em] uppercase pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, delay: 0.8 }}
                >
                  toque para revelar
                </motion.p>
              )}
              {phase === 'revealed' && flipped && (
                <motion.p
                  className="absolute -bottom-9 text-[9px] tracking-[0.25em] uppercase pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.20)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{
                    duration: 1.4,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: FLIP_ANIM_MS[card.effect] / 1000 + 0.4,
                  }}
                >
                  {currentIdx < totalCards - 1 ? 'próxima →' : '✨ pack revelado'}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Suspense charging rings for legendary/ultra (face-down) */}
        <AnimatePresence>
          {phase === 'facedown' && (card.effect === 'legendary' || card.effect === 'ultra') && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: 180 + i * 40,
                    height: 240 + i * 55,
                    borderColor: back.border,
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 0.6, 0], scale: [0.9, 1.05, 0.9] }}
                  transition={{
                    duration: card.effect === 'ultra' ? 1.0 : 1.4,
                    delay: i * 0.25,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card name revealed strip (after flip) ── */}
      <AnimatePresence>
        {phase === 'revealed' && flipped && (
          <motion.div
            className="text-center z-10 pb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: FLIP_ANIM_MS[card.effect] / 1000 + 0.15, duration: 0.4 }}
          >
            <p
              className="font-display text-2xl tracking-wider"
              style={{
                background: `linear-gradient(180deg, #fff, ${back.border})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 16px ${back.glow})`,
              }}
            >
              {card.card.displayName}
            </p>
            {card.isDuplicate && (
              <p className="text-[10px] text-purple-400 mt-0.5">
                duplicata · +{card.fragmentsGained} fragmentos
              </p>
            )}
            <p className="text-[9px] text-white/30 mt-0.5 uppercase tracking-widest">
              {card.card.position} · {card.card.rarityLabel}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
