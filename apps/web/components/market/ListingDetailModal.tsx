'use client';

import { RARITY_VISUAL } from '@/lib/collection-data';
import { priceChangeLabel } from '@/lib/marketplace/filters';
import { getCardMarketStats } from '@/lib/marketplace/mock-listings';
import type { MarketListing } from '@/lib/marketplace/types';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

type Props = {
  listing: MarketListing;
  inWatchlist: boolean;
  onClose: () => void;
  onWatch: () => void;
};

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(59,130,246,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

export function ListingDetailModal({ listing, inWatchlist, onClose, onWatch }: Props) {
  const visual = RARITY_VISUAL[listing.rarityCode];
  const glow = RARITY_GLOW[listing.rarityCode];
  const stats = useMemo(() => getCardMarketStats(listing.cardId), [listing.cardId]);

  const priceChange = stats ? priceChangeLabel(stats.priceChange) : null;
  const maxHistory = stats ? Math.max(...stats.priceHistory.map((h) => h.price)) : 1;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[61] sm:p-4"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div
          className={[
            'relative w-full sm:max-w-lg bg-midnight border rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto',
            visual.borderClass,
          ].join(' ')}
          style={{ boxShadow: `0 0 40px ${glow}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Hero */}
          <div
            className={`relative px-6 pt-4 pb-6 ${visual.bgClass}`}
            style={{ background: `linear-gradient(135deg, ${RARITY_BG[listing.rarityCode]})` }}
          >
            <div
              className="absolute -top-10 right-0 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ background: glow }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <button onClick={onClose} className="text-white/50 hover:text-white text-sm">
                ✕ Fechar
              </button>
              <button
                onClick={onWatch}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-sm hover:scale-110 transition-transform"
              >
                {inWatchlist ? '❤️' : '🤍'}
              </button>
            </div>

            {/* Card visual */}
            <div className="flex items-end gap-5 relative z-10">
              <div
                className={`w-24 h-32 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden shrink-0 ${visual.borderClass}`}
                style={{ background: 'rgba(0,0,0,0.4)', boxShadow: `0 0 20px ${glow}` }}
              >
                <p
                  className="font-display text-4xl leading-none"
                  style={{
                    background: `linear-gradient(180deg, #fff, ${glow})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {listing.cardOvr}
                </p>
                <div className="absolute bottom-1 left-0 right-0 text-center">
                  <p className="text-parchment text-[7px] font-bold truncate px-1">
                    {listing.cardName.split(' ').pop()}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${visual.textClass}`}
                >
                  {listing.rarityLabel}
                </span>
                <h2 className="font-display text-2xl text-white leading-tight tracking-wider mt-0.5">
                  {listing.cardName.toUpperCase()}
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  {listing.flagEmoji} {listing.nationality} · {listing.position} · {listing.era}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {listing.isNew && <Badge text="NOVO" color="emerald" />}
                  {listing.isTrending && <Badge text="🔥 TREND" color="orange" />}
                  {listing.type === 'auction' && <Badge text="LEILÃO" color="purple" />}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Preço */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted text-[9px] uppercase tracking-wider">
                    {listing.type === 'auction' ? 'Lance atual' : 'Preço'}
                  </p>
                  <p className="font-display text-3xl gold-text">
                    {listing.type === 'auction'
                      ? listing.auction?.currentBid.label
                      : listing.price.label}
                  </p>
                  {listing.originalPrice && (
                    <p className="text-muted text-xs line-through">{listing.originalPrice.label}</p>
                  )}
                </div>
                {stats && priceChange && (
                  <div className="text-right">
                    <p className="text-muted text-[9px]">7 dias</p>
                    <p className={`font-bold text-sm ${priceChange.color}`}>{priceChange.label}</p>
                  </div>
                )}
              </div>

              {/* Leilão */}
              {listing.type === 'auction' && listing.auction && (
                <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Lance mín." value={listing.auction.minimumBid.label} />
                  <MiniStat label="Total lances" value={listing.auction.bids} />
                  <MiniStat
                    label="Termina em"
                    value={listing.auction.timeLeft}
                    color="text-purple-400"
                  />
                </div>
              )}

              {/* Botão de compra — desabilitado (em breve) */}
              <button
                disabled
                className="mt-3 w-full py-3 rounded-xl bg-surface border border-border text-muted text-sm font-bold cursor-not-allowed"
              >
                🔒 Comprar — Em breve
              </button>
            </div>

            {/* Vendedor */}
            <div className="glass rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/40 to-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                  {listing.sellerName.charAt(0)}
                </div>
                <div>
                  <p className="text-parchment text-xs font-bold">{listing.sellerName}</p>
                  <p className="text-muted text-[9px]">Nível {listing.sellerLevel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-muted text-[9px]">{listing.views} visualizações</p>
                <p className="text-muted text-[9px]">{listing.favorited} na watchlist</p>
              </div>
            </div>

            {/* Histórico de preços */}
            {stats && (
              <div>
                <p className="text-muted text-[9px] uppercase tracking-wider mb-2">
                  Histórico de preços (7 dias)
                </p>
                <div className="glass rounded-xl p-3">
                  {/* Mini bar chart */}
                  <div className="flex items-end gap-1 h-16 mb-2">
                    {stats.priceHistory.map((h, i) => {
                      const pct = Math.round((h.price / maxHistory) * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${pct}%`,
                              background:
                                'linear-gradient(180deg, rgba(201,168,76,0.8), rgba(201,168,76,0.3))',
                              minHeight: 4,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-muted">
                    <span>{stats.priceHistory[0]?.date.slice(5)}</span>
                    <span className="gold-text font-bold">{listing.price.label} (agora)</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                    <MiniStat
                      label="Mínimo 7d"
                      value={`${stats.minPrice.toLocaleString('pt-BR')}c`}
                    />
                    <MiniStat
                      label="Média 7d"
                      value={`${stats.avgPrice.toLocaleString('pt-BR')}c`}
                      color="text-gold"
                    />
                    <MiniStat label="Vendas 7d" value={stats.salesLast7d} />
                  </div>
                </div>
              </div>
            )}

            {/* Detalhes da carta */}
            <div>
              <p className="text-muted text-[9px] uppercase tracking-wider mb-2">
                Detalhes da carta
              </p>
              <div className="grid grid-cols-3 gap-2">
                <DetailCard label="Evolução" value={`+${listing.evolution}`} color="text-gold" />
                <DetailCard
                  label="Contratos"
                  value={listing.contracts}
                  color={listing.contracts < 3 ? 'text-yellow-400' : 'text-emerald-400'}
                />
                <DetailCard label="OVR" value={listing.cardOvr} color="text-parchment" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Badge({ text, color }: { text: string; color: string }) {
  const COLORS: Record<string, string> = {
    emerald: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400',
    orange: 'bg-orange-900/40  border-orange-700/50  text-orange-400',
    purple: 'bg-purple-900/40  border-purple-700/50  text-purple-400',
  };
  return (
    <span
      className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border ${COLORS[color] ?? ''}`}
    >
      {text}
    </span>
  );
}

function MiniStat({
  label,
  value,
  color = 'text-parchment',
}: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <p className={`font-bold text-sm ${color}`}>{value}</p>
      <p className="text-muted text-[8px]">{label}</p>
    </div>
  );
}

function DetailCard({
  label,
  value,
  color,
}: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-xl p-2.5 text-center">
      <p className={`font-display text-xl ${color}`}>{value}</p>
      <p className="text-muted text-[9px] mt-0.5">{label}</p>
    </div>
  );
}

const RARITY_BG: Record<string, string> = {
  common: '#0c0d10, #13151a',
  rare: '#0a0018, #1a0040',
  elite: '#000d20, #001840',
  legendary: '#120900, #2d1800',
  ultra: '#1a0012, #330024',
  world_cup_hero: '#04040a, #0a0818',
};
