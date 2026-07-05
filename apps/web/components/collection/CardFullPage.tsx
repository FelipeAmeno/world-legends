'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_META } from '@/lib/hall-of-legends-data';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const FAV_KEY = 'wl:collection:favorites';
const DREAM_KEY = 'wl:dream-team';
const DREAM_MAX = 11;

const RARITY_COLORS: Record<string, string> = {
  common: 'rgba(107,114,128,0.5)',
  rare: 'rgba(168,85,247,0.6)',
  elite: 'rgba(59,130,246,0.65)',
  legendary: 'rgba(201,168,76,0.7)',
  ultra: 'rgba(236,72,153,0.65)',
  world_cup_hero: 'rgba(240,244,255,0.75)',
};

const RARITY_SOLID: Record<string, string> = {
  common: '#6b7280',
  rare: '#a855f7',
  elite: '#3b82f6',
  legendary: '#c9a84c',
  ultra: '#ec4899',
  world_cup_hero: '#e2e8f0',
};

const RARITY_BG: Record<string, [string, string]> = {
  common: ['#0c0d10', '#181a20'],
  rare: ['#0a0018', '#1a0040'],
  elite: ['#000d20', '#001840'],
  legendary: ['#120900', '#2d1800'],
  ultra: ['#1a0012', '#330024'],
  world_cup_hero: ['#04040a', '#0e0c18'],
};

const ATTR_LABELS: Array<{ key: string; label: string; icon: string; color: string }> = [
  { key: 'pace', label: 'Ritmo', icon: '⚡', color: '#f59e0b' },
  { key: 'shooting', label: 'Finalização', icon: '🎯', color: '#ef4444' },
  { key: 'passing', label: 'Passe', icon: '🔄', color: '#10b981' },
  { key: 'dribbling', label: 'Drible', icon: '🌀', color: '#3b82f6' },
  { key: 'defending', label: 'Defesa', icon: '🛡', color: '#6366f1' },
  { key: 'physical', label: 'Físico', icon: '💪', color: '#ec4899' },
];

const TIER_STARS = ['', '★', '★★', '★★★'] as const;

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, s: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...s]));
  } catch {
    /* noop */
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  card: CollectionCard;
  owned: boolean;
};

export function CardFullPage({ card, owned }: Props) {
  const router = useRouter();

  const [isFav, setIsFav] = useState(false);
  const [isDreamTeam, setIsDreamTeam] = useState(false);
  const [dreamCount, setDreamCount] = useState(0);
  const [showAttrs, setShowAttrs] = useState(false);

  useEffect(() => {
    const favs = loadSet(FAV_KEY);
    const dream = loadSet(DREAM_KEY);
    setIsFav(favs.has(card.cardId));
    setIsDreamTeam(dream.has(card.cardId));
    setDreamCount(dream.size);
    // Stagger attributes reveal
    const t = setTimeout(() => setShowAttrs(true), 600);
    return () => clearTimeout(t);
  }, [card.cardId]);

  const toggleFav = useCallback(() => {
    setIsFav((prev) => {
      const next = !prev;
      const favs = loadSet(FAV_KEY);
      if (next) favs.add(card.cardId);
      else favs.delete(card.cardId);
      saveSet(FAV_KEY, favs);
      return next;
    });
  }, [card.cardId]);

  const toggleDreamTeam = useCallback(() => {
    setIsDreamTeam((prev) => {
      const next = !prev;
      const dream = loadSet(DREAM_KEY);
      if (next) {
        if (dream.size >= DREAM_MAX) return prev; // full
        dream.add(card.cardId);
      } else {
        dream.delete(card.cardId);
      }
      saveSet(DREAM_KEY, dream);
      setDreamCount(dream.size);
      return next;
    });
  }, [card.cardId]);

  const color = RARITY_SOLID[card.rarityCode] ?? '#c9a84c';
  const glow = RARITY_COLORS[card.rarityCode] ?? 'rgba(201,168,76,0.5)';
  const [bgFrom, bgTo] = RARITY_BG[card.rarityCode] ?? ['#0c0d10', '#181a20'];
  const meta = RARITY_META[card.rarityCode];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${bgFrom} 0%, ${bgTo} 100%)` }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${glow} 0%, transparent 60%)`,
        }}
      />
      <div
        className="fixed top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: color }}
      />

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 shrink-0"
      >
        <motion.button
          onClick={() => router.back()}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span className="text-white text-sm">←</span>
          <span className="text-white/60 text-xs font-medium">Coleção</span>
        </motion.button>

        {/* Actions */}
        {owned && (
          <div className="flex items-center gap-2">
            {/* Dream Team */}
            <motion.button
              onClick={toggleDreamTeam}
              whileTap={{ scale: 0.88 }}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: isDreamTeam ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                border: isDreamTeam
                  ? '1px solid rgba(245,158,11,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <motion.span
                style={{ fontSize: 16 }}
                animate={isDreamTeam ? { rotate: [0, 20, -10, 0], scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {isDreamTeam ? '⭐' : '☆'}
              </motion.span>
            </motion.button>

            {/* Favorite */}
            <motion.button
              onClick={toggleFav}
              whileTap={{ scale: 0.88 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isFav ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.06)',
                border: isFav
                  ? '1px solid rgba(236,72,153,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <motion.span
                style={{ fontSize: 18 }}
                animate={isFav ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isFav ? '❤️' : '🤍'}
              </motion.span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* ── Hero ── */}
      <motion.div
        className="relative z-10 px-6 pt-2 pb-8 shrink-0"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Rarity badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}40`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>
            {card.rarityCode === 'world_cup_hero' ? 'World Cup Hero' : meta?.label}
          </span>
          {!owned && (
            <span className="text-[9px] font-bold opacity-70" style={{ color }}>
              · Não possui
            </span>
          )}
        </motion.div>

        {/* OVR + Name */}
        <div className="flex items-end gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
          >
            <p
              className="font-display leading-none"
              style={{
                fontSize: 88,
                background: `linear-gradient(180deg, #ffffff 0%, ${color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 20px ${glow})`,
                opacity: owned ? 1 : 0.35,
              }}
            >
              {card.overall}
            </p>
          </motion.div>

          <div className="pb-3 flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="font-display text-3xl text-white leading-tight tracking-wider truncate"
              style={{ opacity: owned ? 1 : 0.5 }}
            >
              {card.displayName.toUpperCase()}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mt-1 flex-wrap"
            >
              <span className="text-2xl">{card.flagEmoji}</span>
              <span className="text-white/50 text-sm">{card.nationality}</span>
              <span className="text-white/25">·</span>
              <span className="text-white/50 text-sm font-bold">{card.position}</span>
              <span className="text-white/25">·</span>
              <span className="text-white/40 text-sm">{card.era}</span>
            </motion.div>
          </div>
        </div>

        {/* Full name if different */}
        {card.fullName !== card.displayName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-white/25 text-xs mt-1"
          >
            {card.fullName}
          </motion.p>
        )}
      </motion.div>

      {/* Divider glow line */}
      <div
        className="mx-6 h-px shrink-0"
        style={{ background: `linear-gradient(90deg, ${color}50, transparent)` }}
      />

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-6 pt-6 space-y-7">
          {/* Bio */}
          {card.bioShort && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SectionLabel label="História" />
              <p
                className="text-white/55 text-sm leading-relaxed"
                style={{ opacity: owned ? 1 : 0.5 }}
              >
                {owned
                  ? card.bioShort
                  : '???  Abra esta carta para descobrir a história desta lenda.'}
              </p>
            </motion.section>
          )}

          {/* Attributes */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
          >
            <SectionLabel label="Atributos" />
            <div className="space-y-3">
              {ATTR_LABELS.map(({ key, label, icon, color: attrColor }, i) => {
                const val = (card.attributes[key] as number) ?? 0;
                const pct = Math.round((val / 99) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13 }}>{icon}</span>
                        <span className="text-white/50 text-xs">{label}</span>
                      </div>
                      <span
                        className="font-display text-base leading-none"
                        style={{ color: owned ? attrColor : 'rgba(255,255,255,0.2)' }}
                      >
                        {owned ? val : '?'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${attrColor}70, ${attrColor})`,
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: showAttrs && owned ? `${pct}%` : '0%' }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Traits */}
          {card.traits.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
            >
              <SectionLabel label="Habilidades" />
              <div className="flex flex-wrap gap-2">
                {card.traits.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.07, type: 'spring', stiffness: 300 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full"
                    style={{
                      background: `${color}${owned ? '10' : '05'}`,
                      border: `1px solid ${color}${owned ? '30' : '15'}`,
                      opacity: owned ? 1 : 0.4,
                    }}
                  >
                    <span className="text-parchment text-xs font-semibold">{t.name}</span>
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        color:
                          t.tier === 3 ? '#fbbf24' : t.tier === 2 ? color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {TIER_STARS[t.tier]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Edition / Status */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.54 }}
          >
            <SectionLabel label="Informações" />
            <div className="grid grid-cols-3 gap-3">
              <InfoCard
                label="Raridade"
                value={meta?.label ?? card.rarityCode}
                valueColor={color}
              />
              <InfoCard label="Edição" value={card.editionCode} valueColor="text-parchment" />
              <InfoCard label="Época" value={card.era} valueColor="text-parchment" />
              <InfoCard label="Posição" value={card.position} valueColor="text-parchment" />
              <InfoCard
                label="País"
                value={`${card.flagEmoji} ${card.nationality}`}
                valueColor="text-parchment"
              />
              {owned && <InfoCard label="Contratos" value="10" valueColor="text-emerald-400" />}
            </div>
          </motion.section>

          {/* Not owned CTA */}
          {!owned && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color}08, rgba(0,0,0,0.4))`,
                border: `1px solid ${color}20`,
              }}
            >
              <div className="p-5 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-white/60 text-sm font-semibold mb-1">
                  Você ainda não possui esta carta
                </p>
                <p className="text-white/30 text-xs mb-4 leading-relaxed">
                  Abra packs para tentar conseguir <span style={{ color }}>{card.displayName}</span>{' '}
                  e outros lendas
                </p>
                <motion.button
                  onClick={() => router.push('/packs')}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${color}30, ${color}15)`,
                    border: `1px solid ${color}40`,
                    color,
                  }}
                >
                  Abrir Pack →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Dream Team context */}
          {owned && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="pb-4"
            >
              {isDreamTeam ? (
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}
                >
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: '#f59e0b' }}>
                      No seu Dream Team
                    </p>
                    <p className="text-muted text-[10px] mt-0.5">
                      {dreamCount}/{DREAM_MAX} posições preenchidas
                    </p>
                  </div>
                  <button
                    onClick={toggleDreamTeam}
                    className="ml-auto text-muted text-xs hover:text-red-400 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ) : dreamCount < DREAM_MAX ? (
                <motion.button
                  onClick={toggleDreamTeam}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl transition-all"
                  style={{
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px dashed rgba(245,158,11,0.2)',
                  }}
                >
                  <span>☆</span>
                  <span className="text-xs font-bold" style={{ color: 'rgba(245,158,11,0.5)' }}>
                    Adicionar ao Dream Team ({dreamCount}/{DREAM_MAX})
                  </span>
                </motion.button>
              ) : (
                <p className="text-center text-muted text-[10px] pb-2">
                  Dream Team completo ({DREAM_MAX}/{DREAM_MAX})
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="text-[9px] font-black uppercase tracking-[0.22em] mb-3"
      style={{ color: 'rgba(255,255,255,0.3)' }}
    >
      {label}
    </p>
  );
}

function InfoCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  const colorStyle =
    valueColor.startsWith('#') || valueColor.startsWith('rgba') ? { color: valueColor } : {};
  const colorClass = valueColor.startsWith('text-') ? valueColor : '';

  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-[8px] text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-display text-sm leading-none ${colorClass}`} style={colorStyle}>
        {value}
      </p>
    </div>
  );
}
