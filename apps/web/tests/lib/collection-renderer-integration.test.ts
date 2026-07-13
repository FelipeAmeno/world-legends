import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shouldShowZone } from '@/components/cards/FullArtworkWorldLegendsCard';
import { resolveHudLayout } from '@/lib/card-static/hud-layout';
import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import { resolvePlayerCardRenderer } from '@/lib/card-static/resolve-player-card-renderer';
import { getCollection } from '@/lib/collection-data';
import { describe, expect, it } from 'vitest';

const TEN_PILOT_PLAYER_IDS = [
  'pelé',
  'ronaldinho',
  'ronaldo',
  'maradona',
  'lionel-messi',
  'cristiano-ronaldo',
  'neymar',
  'kylian-mbappe',
  'zinedine-zidane',
  'franz-beckenbauer',
] as const;

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 36 — Collection renderer integration', () => {
  const collection = getCollection();

  it('1. jogador da Collection com preset válido resolve full-artwork', () => {
    const pele = collection.find((c) => c.playerId === 'pelé');
    expect(pele).toBeDefined();
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: pele?.artworkPresetId,
        cardId: pele?.cardId ?? '',
        playerId: 'pelé',
        rarity: pele?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
    );
    expect(result.renderer).toBe('full-artwork');
  });

  it('2. jogador da Collection sem preset resolve procedural', () => {
    const zico = collection.find((c) => c.playerId === 'zico');
    expect(zico).toBeDefined();
    expect(zico?.artworkPresetId).toBeUndefined();
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: zico?.artworkPresetId,
        cardId: zico?.cardId ?? '',
        playerId: 'zico',
        rarity: zico?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' });
  });

  it('3. productionEligible false resolve procedural', () => {
    const manifest = [
      {
        id: 'wl-draft-001',
        generated: {
          compact: { src: '/x/compact.webp', sizeKB: 10 },
          standard: { src: '/x/standard.webp', sizeKB: 20 },
          showcase: { src: '/x/showcase.webp', sizeKB: 30 },
        },
        productionEligible: false,
      },
    ];
    const result = resolvePlayerCardRenderer(
      { artworkPresetId: 'wl-draft-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
    );
    expect(result).toEqual({
      renderer: 'procedural',
      fallbackReason: 'preset-not-production-eligible',
    });
  });

  it('4. preset sem NENHUMA densidade gerada resolve procedural (artwork-output-not-found)', () => {
    const manifest = [
      {
        id: 'wl-empty-001',
        generated: { compact: null, standard: null, showcase: null },
        productionEligible: true,
      },
    ];
    const result = resolvePlayerCardRenderer(
      { artworkPresetId: 'wl-empty-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
    );
    expect(result).toEqual({
      renderer: 'procedural',
      fallbackReason: 'artwork-output-not-found',
    });
  });

  it('5. Compact não carrega nickname — resolveHudLayout(compact) nunca marca a zona visível nos 10 pilotos', () => {
    for (const id of TEN_PILOT_PLAYER_IDS) {
      const card = collection.find((c) => c.playerId === id);
      expect(card).toBeDefined();
      const preset = CARD_STATIC_MANIFEST.find((p) => p.id === card?.artworkPresetId);
      expect(preset).toBeDefined();
      const compactLayout = resolveHudLayout(preset, 'compact');
      expect(shouldShowZone(compactLayout.nickname, 'compact', ['compact'])).toBe(false);
    }
  });

  it('6. Collection pede só o output Compact — grade real (HallOfLegendsExperience/MuseumCard) força density="compact" no código-fonte', () => {
    // /collection renderiza HallOfLegendsExperience (ver app/collection/page.tsx),
    // não CollectionCardTile/CollectionExperience — esses ficaram órfãos
    // (nenhuma rota os importa) numa refatoração anterior; verificado com
    // grep antes desta sprint. A grade REAL de jogadores é `MuseumCard`
    // dentro deste arquivo.
    const src = readSource('components/hall-of-legends/HallOfLegendsExperience.tsx');
    expect(src).toContain('density="compact"');
    expect(src).not.toMatch(/density=["']standard["']/);
    expect(src).not.toMatch(/density=["']showcase["']/);
  });

  it('7. clique na carta resolvida preserva a interação existente (handleClick no wrapper, não no card)', () => {
    const src = readSource('components/hall-of-legends/HallOfLegendsExperience.tsx');
    // O onClick continua no `motion.div` que ENVOLVE o card resolvido —
    // não foi movido pra dentro do componente de carta, então long-press
    // (spotlight), modo comparar e os botões de ação continuam
    // funcionando igual.
    expect(src).toMatch(/onClick=\{handleClick\}[\s\S]*<ResolvedWorldLegendsCard/);
  });

  it('6b/7b. a grade órfã (CollectionCardTile, não roteada por nenhuma página hoje) também segue o mesmo padrão, caso seja reativada', () => {
    const src = readSource('components/collection/CollectionCardTile.tsx');
    expect(src).toContain('density="compact"');
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*onSelect\(card\)\}[\s\S]*<ResolvedWorldLegendsCard/);
  });

  it('8. os 10 jogadores piloto usam 10 URLs de asset Compact únicas', () => {
    const urls = TEN_PILOT_PLAYER_IDS.map((id) => {
      const card = collection.find((c) => c.playerId === id);
      const artwork = resolveGeneratedArtwork(
        CARD_STATIC_MANIFEST,
        card?.artworkPresetId ?? '',
        'compact',
      );
      expect(artwork).not.toBeNull();
      return artwork?.src;
    });
    expect(new Set(urls).size).toBe(TEN_PILOT_PLAYER_IDS.length);
  });

  it('9. nenhum componente de Collection contém whitelist de jogador hardcoded', () => {
    const files = [
      'components/hall-of-legends/HallOfLegendsExperience.tsx',
      'components/hall-of-legends/CardSpotlightModal.tsx',
      'components/collection/CollectionCardTile.tsx',
      'components/collection/CardDetailModal.tsx',
      'app/collection/page.tsx',
    ];
    const forbidden = [
      'pelé',
      'ronaldinho',
      'lionel-messi',
      'cristiano-ronaldo',
      'kylian-mbappe',
      'zinedine-zidane',
      'franz-beckenbauer',
      'wl-goat-brazil-001',
      'wl-legendary-ronaldinho-001',
    ];
    for (const file of files) {
      const src = readSource(file).toLowerCase();
      for (const name of forbidden) {
        expect(src.includes(name.toLowerCase())).toBe(false);
      }
    }
  });

  it('10. resolvePlayerCardRenderer só é chamado de UM lugar de produção (ResolvedWorldLegendsCard) — sem lógica duplicada', () => {
    const productionCardFiles = [
      'components/cards/PlayerCard.tsx',
      'components/cards/ResolvedWorldLegendsCard.tsx',
      'components/collection/CollectionCardTile.tsx',
      'components/collection/CardDetailModal.tsx',
      'components/hall-of-legends/HallOfLegendsExperience.tsx',
      'components/hall-of-legends/CardSpotlightModal.tsx',
    ];
    const callers = productionCardFiles.filter((f) =>
      readSource(f).includes('resolvePlayerCardRenderer('),
    );
    expect(callers).toEqual(['components/cards/ResolvedWorldLegendsCard.tsx']);
  });

  it('FullArtworkWorldLegendsCard não vive mais em components/dev/ (dependência dev-only removida do componente de produção)', () => {
    const src = readSource('components/cards/PlayerCard.tsx');
    expect(src).not.toMatch(/from ['"].*\/dev\//);
    const resolvedSrc = readSource('components/cards/ResolvedWorldLegendsCard.tsx');
    expect(resolvedSrc).not.toMatch(/from ['"].*\/dev\//);
  });
});
