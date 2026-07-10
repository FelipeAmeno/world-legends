'use client';

/**
 * components/dev/PackRevealQaHarness.tsx — Sprint 34 (Official Art Pack
 * Integration, item 7: "Pack Reveal — modo de QA protegido").
 *
 * Ferramenta interna (`/dev/pack-reveal-qa`) — abre o MESMO
 * `CardRevealScene` de produção (nenhum componente novo/paralelo), mas
 * com um seletor de raridade que monta `DrawnCard[]` sintéticos na hora
 * (cartas reais do catálogo, cor/efeito reais de `pack-logic.ts`) em vez
 * de chamar `openPack()`. Isso é deliberado: `openPack()` sorteia por
 * odds reais (o que o brief pede pra NÃO tocar), e o objetivo aqui é
 * escolher a raridade pra testar, não sortear. Nenhuma chamada de server
 * action, nenhuma escrita no Supabase — a carta "aberta" aqui nunca entra
 * na coleção real do usuário.
 */

import { CardRevealScene } from '@/components/packs/CardRevealScene';
import { getCollection } from '@/lib/collection-data';
import { GLOW_MAP, PACK_DEFS, PARTICLE_MAP } from '@/lib/pack-logic';
import type { DrawnCard, RevealEffect } from '@/lib/pack-logic';
import type { RarityCode } from '@world-legends/types';
import { useMemo, useState } from 'react';

const RARITY_OPTIONS: Array<{ code: RarityCode; label: string }> = [
  { code: 'common', label: 'Common' },
  { code: 'rare', label: 'Rare' },
  { code: 'elite', label: 'Elite' },
  { code: 'legendary', label: 'Legendary' },
  { code: 'ultra', label: 'Ultra (GOAT)' },
  { code: 'world_cup_hero', label: 'World Cup Hero' },
];

const EFFECT_MAP: Record<RarityCode, RevealEffect> = {
  common: 'common',
  rare: 'rare',
  elite: 'elite',
  legendary: 'legendary',
  ultra: 'ultra',
  world_cup_hero: 'world_cup_hero',
};

// Só pra alimentar props decorativas do CardRevealScene (gradiente/nome/
// ícone do pack) — nenhum campo econômico (price/guarantee) é usado.
const QA_PACK = PACK_DEFS[0];

export function PackRevealQaHarness() {
  const [selected, setSelected] = useState<RarityCode>('common');
  const [session, setSession] = useState(0);
  const [done, setDone] = useState(false);

  const allCards = useMemo(() => getCollection(), []);

  const cards: DrawnCard[] = useMemo(() => {
    const pool = allCards.filter((c) => c.rarityCode === selected);
    const picked = pool.length > 0 ? pool.slice(0, 3) : allCards.slice(0, 3);
    return picked.map((card, i) => ({
      index: i,
      card,
      effect: EFFECT_MAP[selected],
      wasForced: false,
      glowColor: GLOW_MAP[selected],
      particleColor: PARTICLE_MAP[selected],
    }));
  }, [allCards, selected]);

  if (!QA_PACK) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#e5e7eb' }}>
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Pack Reveal QA</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16, maxWidth: 640 }}>
          Ferramenta interna (Sprint 34) — abre o mesmo <code>CardRevealScene</code> de produção com
          raridade escolhida manualmente, sem chamar <code>openPack()</code> (odds reais intactas) e
          sem creditar nada na coleção real (nenhuma server action é chamada aqui).
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {RARITY_OPTIONS.map((opt) => (
            <label
              key={opt.code}
              style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 6,
                border: `1px solid ${selected === opt.code ? '#e5e7eb' : '#3f3f46'}`,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="qa-rarity"
                checked={selected === opt.code}
                onChange={() => setSelected(opt.code)}
                style={{ marginRight: 6 }}
              />
              {opt.label}
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setDone(false);
            setSession((s) => s + 1);
          }}
          style={{
            fontSize: 13,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #3f3f46',
            background: '#18181b',
            color: '#e5e7eb',
            cursor: 'pointer',
          }}
        >
          ▶ Testar reveal ({RARITY_OPTIONS.find((o) => o.code === selected)?.label})
        </button>
        {done && (
          <p style={{ fontSize: 12, color: '#4ade80', marginTop: 8 }}>
            ✓ Reveal concluído — nenhuma escrita na coleção real.
          </p>
        )}
      </div>

      {session > 0 && (
        <div key={session} style={{ position: 'relative', height: '80vh' }}>
          <CardRevealScene cards={cards} pack={QA_PACK} onAllFlipped={() => setDone(true)} />
        </div>
      )}
    </div>
  );
}
