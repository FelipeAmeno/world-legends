'use client';

/**
 * AlbumPage — T75 / T76
 *
 * Álbum estilo Panini com sets colecionáveis.
 * Cada slot mostra a carta se o usuário a possui, ou uma silhueta vazia.
 * Completar um set desbloqueia recompensa em créditos.
 */

import { claimCollectionRewardAction, getCollectionsAction } from '@/lib/actions/collections';
import type { CollectionSetView } from '@/lib/actions/collections.types';
import { getCollection } from '@/lib/collection-data';
import { COLLECTION_SETS } from '@/lib/collection-sets';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { AlbumClaimToast } from './AlbumClaimToast';
import { AlbumSetPanel } from './AlbumSetPanel';

const THEME_STYLES: Record<string, { border: string; glow: string; badge: string }> = {
  classic: {
    border: 'border-steel/40',
    glow: 'shadow-[0_0_20px_rgba(100,116,139,0.3)]',
    badge: 'bg-steel/20 text-steel border-steel/30',
  },
  gold: {
    border: 'border-gold/40',
    glow: 'shadow-[0_0_20px_rgba(201,168,76,0.35)]',
    badge: 'bg-gold/20 text-gold border-gold/30',
  },
  steel: {
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    badge: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
  },
  epic: {
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    badge: 'bg-purple-900/30 text-purple-300 border-purple-500/30',
  },
  legendary: {
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.4)]',
    badge: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30',
  },
  goat: {
    border: 'border-amber-400/60',
    glow: 'shadow-[0_0_32px_rgba(251,191,36,0.5)]',
    badge: 'bg-amber-900/30 text-amber-300 border-amber-400/40',
  },
};

export function AlbumPage() {
  const [views, setViews] = useState<CollectionSetView[]>([]);
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ name: string; credits: number } | null>(null);
  const [isPending, startT] = useTransition();

  const allCatalogCards = getCollection();
  const cardMap = new Map(allCatalogCards.map((c) => [c.cardId, c]));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCollectionsAction().then((data) => {
      if (cancelled) return;
      setViews([...data.views] as CollectionSetView[]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClaim = useCallback((setCode: string) => {
    startT(async () => {
      const result = await claimCollectionRewardAction(setCode);
      if (!result.ok) return;

      setViews((prev) => prev.map((v) => (v.def.code === setCode ? { ...v, isClaimed: true } : v)));

      const def = COLLECTION_SETS.find((s) => s.code === setCode);
      if (def) {
        setToast({ name: def.name, credits: result.creditsEarned });
      }
    });
  }, []);

  const totalCompleted = views.filter((v) => v.isCompleted).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="h-8 w-48 bg-surface rounded-lg animate-pulse mb-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-surface border border-border animate-pulse"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl gold-text tracking-wider">ÁLBUM</h1>
          <p className="text-muted text-xs mt-0.5">
            {totalCompleted > 0 ? (
              <span className="text-emerald-400 font-bold">
                {totalCompleted}/{COLLECTION_SETS.length} conjuntos completos
              </span>
            ) : (
              <span>{COLLECTION_SETS.length} conjuntos para completar</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted text-[9px] uppercase tracking-wider">Progresso</p>
          <p className="font-display text-lg text-parchment">
            {totalCompleted}/{COLLECTION_SETS.length}
          </p>
        </div>
      </div>

      {/* Set grid */}
      <div className="space-y-3">
        {views.map((view) => (
          <AlbumSetCard
            key={view.def.code}
            view={view}
            isActive={activeSet === view.def.code}
            onToggle={() => setActiveSet(activeSet === view.def.code ? null : view.def.code)}
            onClaim={handleClaim}
            disabled={isPending}
            cardMap={cardMap}
          />
        ))}
      </div>

      <AlbumClaimToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

// ─── Set card (accordion) ─────────────────────────────────────────────────────

type SetCardProps = {
  view: CollectionSetView;
  isActive: boolean;
  onToggle: () => void;
  onClaim: (code: string) => void;
  disabled: boolean;
  cardMap: Map<string, import('@/lib/collection-data').CollectionCard>;
};

function AlbumSetCard({ view, isActive, onToggle, onClaim, disabled, cardMap }: SetCardProps) {
  const { def, completionPct, isCompleted, isClaimed, ownedCardIds } = view;
  const theme = THEME_STYLES[def.theme] ?? THEME_STYLES.classic!;
  const ownedSet = new Set(ownedCardIds);

  return (
    <motion.div
      layout
      className={[
        'rounded-2xl border overflow-hidden transition-all duration-200',
        isCompleted && !isClaimed ? `${theme.border} ${theme.glow}` : 'border-border bg-surface',
        isClaimed ? 'opacity-70' : '',
      ].join(' ')}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/3 transition-colors"
      >
        {/* Icon */}
        <motion.div
          className="w-12 h-12 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-2xl shrink-0"
          animate={isCompleted && !isClaimed ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          {def.icon}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-parchment text-sm font-bold leading-tight truncate">{def.name}</p>
            {isClaimed && <span className="text-emerald-400 text-xs font-bold shrink-0">✓</span>}
            {isCompleted && !isClaimed && (
              <motion.span
                className="shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full border bg-gold/20 text-gold border-gold/40"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
              >
                PRONTO!
              </motion.span>
            )}
          </div>
          <p className="text-muted text-[10px] mt-0.5">
            {ownedCardIds.length}/{def.requiredCardIds.length} cartas
          </p>

          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className={`h-full rounded-full ${isCompleted ? 'bg-gold' : 'bg-steel'}`}
              initial={{ width: '0%' }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Reward */}
        <div className="shrink-0 text-right">
          <p className="text-muted text-[9px] uppercase tracking-wider">Recompensa</p>
          <p className="text-amber-400 text-xs font-bold">
            {def.rewardSoftCurrency.toLocaleString('pt-BR')} 💰
          </p>
        </div>

        {/* Chevron */}
        <motion.span
          className="text-muted ml-1 shrink-0"
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      {/* Expandable panel */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <p className="text-muted text-[10px] mb-3">{def.description}</p>

              {/* Card slots grid */}
              <AlbumSetPanel def={def} ownedSet={ownedSet} cardMap={cardMap} />

              {/* Claim button */}
              {isCompleted && !isClaimed && (
                <motion.button
                  onClick={() => onClaim(def.code)}
                  disabled={disabled}
                  className="w-full mt-4 py-3 rounded-xl font-display text-sm tracking-wider transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
                    boxShadow: '0 0 20px rgba(201,168,76,0.5)',
                    color: '#07080f',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🎁 COLETAR {def.rewardSoftCurrency.toLocaleString('pt-BR')} CRÉDITOS
                </motion.button>
              )}
              {isClaimed && (
                <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold">
                  <span>✓</span>
                  <span>Recompensa coletada</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
