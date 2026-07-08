'use client';

/**
 * Layer 2 — efeito de acabamento por raridade: reflexo de vidro, sheen
 * animado, vinheta de profundidade e os acabamentos especiais de Ultra/GOAT.
 * Asset-capable como textura estática (`getRarityEffectAssetPath`); quando
 * ausente, cai no efeito procedural atual (idêntico ao de antes da Sprint 18.5).
 */

import { resolveRarityEffect } from '@/lib/card-asset-loader';
import { motion } from 'framer-motion';
import { RARITY_SHIMMER } from '../card-tokens';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardRarityEffectLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { rarityCode, isGoat, isUltra, isElitePlus } = ctx;
  if (ctx.hiddenLayers?.has('rarityEffect')) return null;

  return (
    <ImageLayer
      asset={resolveRarityEffect(rarityCode)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ zIndex: 6 }}
      fallback={
        <>
          {/* Reflexo de vidro — diagonal, mais forte em raridades altas */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 6,
              background:
                'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 22%, transparent 78%, rgba(255,255,255,0.05) 100%)',
              opacity: isElitePlus ? 1 : 0.5,
            }}
          />

          {/* Sheen animado — todas as raridades exceto Common (que fica "chapada" de propósito) */}
          {RARITY_SHIMMER[rarityCode] && (
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 7,
                background:
                  'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)',
                backgroundSize: '250% 100%',
              }}
              animate={{ backgroundPositionX: ['-120%', '220%'] }}
              transition={{
                duration: isGoat ? 2.2 : isUltra ? 2.6 : rarityCode === 'legendary' ? 3 : 3.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
                repeatDelay: isElitePlus ? 0.4 : 1.4,
              }}
            />
          )}

          {/* Vinheta de profundidade */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 120% 90% at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 55%)',
            }}
          />

          {/* Acabamento GOAT: chuva de estrelas sutil */}
          {isGoat && (
            <div
              className="goat-shimmer-overlay"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }}
            />
          )}

          {/* Acabamento Ultra (GOAT-label): véu arco-íris */}
          {isUltra && (
            <div
              className="ultra-rainbow-overlay"
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            />
          )}
        </>
      }
    />
  );
}
