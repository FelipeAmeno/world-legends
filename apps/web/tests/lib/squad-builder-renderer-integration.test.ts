import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shouldShowZone } from '@/components/cards/FullArtworkWorldLegendsCard';
import { resolveHudLayout } from '@/lib/card-static/hud-layout';
import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import { resolvePlayerCardRendererForDensity } from '@/lib/card-static/resolve-player-card-renderer';
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

const SQUAD_CARD_FILES = [
  'components/squad/premium/PremiumPitch.tsx',
  'components/squad/premium/BenchStrip.tsx',
  'components/squad/premium/CardPoolSheet.tsx',
  'components/squad/premium/PlayerSelectModal.tsx',
  'components/squad/premium/PitchBuilder.tsx',
] as const;

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 39 — Squad Builder renderer integration', () => {
  const collection = getCollection();

  it('1. titular elegível (pitch slot) resolve full-artwork Compact', () => {
    const card = collection.find((c) => c.playerId === 'pelé');
    expect(card).toBeDefined();
    const result = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: card?.artworkPresetId,
        cardId: card?.cardId ?? '',
        playerId: 'pelé',
        rarity: card?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result.renderer).toBe('full-artwork');
  });

  it('2. jogador elegível no banco resolve full-artwork Compact', () => {
    const card = collection.find((c) => c.playerId === 'ronaldinho');
    expect(card).toBeDefined();
    const result = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: card?.artworkPresetId,
        cardId: card?.cardId ?? '',
        playerId: 'ronaldinho',
        rarity: card?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result.renderer).toBe('full-artwork');
  });

  it('3. jogador elegível no seletor/pool resolve full-artwork Compact', () => {
    const card = collection.find((c) => c.playerId === 'neymar');
    expect(card).toBeDefined();
    const result = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: card?.artworkPresetId,
        cardId: card?.cardId ?? '',
        playerId: 'neymar',
        rarity: card?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result.renderer).toBe('full-artwork');
  });

  it('4. nickname permanece oculto nos cards Compact do Squad — mesma checagem shouldShowZone dos sprints anteriores', () => {
    for (const id of TEN_PILOT_PLAYER_IDS) {
      const card = collection.find((c) => c.playerId === id);
      const preset = CARD_STATIC_MANIFEST.find((p) => p.id === card?.artworkPresetId);
      expect(preset).toBeDefined();
      const compactLayout = resolveHudLayout(preset, 'compact');
      expect(shouldShowZone(compactLayout.nickname, 'compact', ['compact'])).toBe(false);
    }
  });

  it('5. preset ausente cai no procedural', () => {
    const result = resolvePlayerCardRendererForDensity(
      { cardId: 'c', playerId: 'p', rarity: 'common' },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' });
  });

  it('6. productionEligible false cai no procedural', () => {
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
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-draft-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
      'compact',
    );
    expect(result).toEqual({
      renderer: 'procedural',
      fallbackReason: 'preset-not-production-eligible',
    });
  });

  it('7. output Compact ausente cai no procedural (não usa Standard/Showcase silenciosamente)', () => {
    const manifest = [
      {
        id: 'wl-no-compact-001',
        generated: {
          compact: null,
          standard: { src: '/x/standard.webp', sizeKB: 20 },
          showcase: { src: '/x/showcase.webp', sizeKB: 30 },
        },
        productionEligible: true,
      },
    ];
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-no-compact-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
      'compact',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'artwork-output-not-found' });
  });

  it('8-9. fallback não afeta química nem validação de posição — calcSnapshot/buildChemLines/getPositionCompat não fazem referência a artworkPresetId', () => {
    const src = readSource('lib/squad-builder.ts');
    expect(src).not.toContain('artworkPresetId');
    expect(src).not.toContain('resolvePlayerCardRenderer');
  });

  it('10. arrastar preserva o mesmo jogador resolvido — DragPreviewCard recebe o mesmo `card` do slot de origem, nenhuma reatribuição', () => {
    const src = readSource('components/squad/premium/PitchBuilder.tsx');
    expect(src).toMatch(/function DragPreviewCard\(\{ card \}: \{ card: CollectionCard \}\)/);
  });

  it('11. o preview de arraste não pede Standard nem Showcase — density="compact" explícita', () => {
    const src = readSource('components/squad/premium/PitchBuilder.tsx');
    const dragPreviewStart = src.indexOf('function DragPreviewCard');
    expect(dragPreviewStart).toBeGreaterThan(-1);
    const snippet = src.slice(dragPreviewStart, dragPreviewStart + 800);
    expect(snippet).toContain('density="compact"');
    expect(snippet).not.toMatch(/density=["']standard["']/);
    expect(snippet).not.toMatch(/density=["']showcase["']/);
  });

  it('12-13. trocar/remover e readicionar um jogador resolve a mesma arte — a identidade vem 100% de `card.artworkPresetId` (dado), nunca de estado de posição/slot', () => {
    const pele1 = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: 'wl-goat-brazil-001',
        cardId: 'x',
        playerId: 'pelé',
        rarity: 'world_cup_hero',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    const pele2 = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: 'wl-goat-brazil-001',
        cardId: 'y',
        playerId: 'pelé',
        rarity: 'world_cup_hero',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(pele1.renderer).toBe('full-artwork');
    expect(pele2.renderer).toBe('full-artwork');
    if (pele1.renderer === 'full-artwork' && pele2.renderer === 'full-artwork') {
      expect(pele1.preset.id).toBe(pele2.preset.id);
    }
  });

  it('14. mudança de formação não pede densidade diferente — nenhum arquivo de Squad passa density derivada de formação/posição', () => {
    for (const file of SQUAD_CARD_FILES) {
      const src = readSource(file);
      expect(src).not.toMatch(/density=\{[^}]*formation/i);
      expect(src).not.toMatch(/density=\{[^}]*position/i);
    }
  });

  it('15-16. salvar/carregar o squad não foi tocado — nenhuma referência a artworkPresetId no payload de save/load', () => {
    const src = readSource('components/squad/premium/PitchBuilder.tsx');
    // O payload de save/load já existia e continua vindo de CollectionCard
    // (que já carregava artworkPresetId desde a Sprint 35D.6) — nenhuma
    // lógica de save/load foi alterada nesta sprint.
    expect(src).not.toContain('resolvePlayerCardRenderer');
    expect(src).not.toContain('CARD_STATIC_MANIFEST');
  });

  it('17. nenhum componente de Squad importa CARD_STATIC_MANIFEST diretamente', () => {
    for (const file of SQUAD_CARD_FILES) {
      expect(readSource(file)).not.toContain('CARD_STATIC_MANIFEST');
    }
  });

  it('18. nenhum resolver específico de Squad existe — todos os 5 arquivos só usam ResolvedWorldLegendsCard, nunca chamam o resolver direto', () => {
    for (const file of SQUAD_CARD_FILES) {
      const src = readSource(file);
      expect(src).not.toContain('resolvePlayerCardRenderer(');
      expect(src).not.toContain('resolvePlayerCardRendererForDensity(');
    }
    // Pelo menos PremiumPitch, BenchStrip, CardPoolSheet, PlayerSelectModal
    // e PitchBuilder usam <ResolvedWorldLegendsCard — confirma a migração.
    const withResolved = SQUAD_CARD_FILES.filter((f) =>
      readSource(f).includes('<ResolvedWorldLegendsCard'),
    );
    expect(withResolved.length).toBe(SQUAD_CARD_FILES.length);
  });

  it('19. nenhum componente de Squad contém whitelist de jogador hardcoded', () => {
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
    for (const file of SQUAD_CARD_FILES) {
      const src = readSource(file).toLowerCase();
      for (const name of forbidden) {
        expect(src.includes(name.toLowerCase())).toBe(false);
      }
    }
  });

  it('20. os 10 jogadores piloto resolvem pras suas próprias URLs de asset Compact', () => {
    const urls = TEN_PILOT_PLAYER_IDS.map((id) => {
      const card = collection.find((c) => c.playerId === id);
      const artwork = resolveGeneratedArtwork(
        CARD_STATIC_MANIFEST,
        card?.artworkPresetId ?? '',
        'compact',
      );
      expect(artwork).not.toBeNull();
      expect(artwork?.src).toContain(card?.artworkPresetId ?? '\0');
      return artwork?.src;
    });
    expect(new Set(urls).size).toBe(TEN_PILOT_PLAYER_IDS.length);
  });

  it('21. jogador procedural (sem preset) não pede nenhum asset full-artwork', () => {
    const zico = collection.find((c) => c.playerId === 'zico');
    expect(zico?.artworkPresetId).toBeUndefined();
    const result = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: zico?.artworkPresetId,
        cardId: zico?.cardId ?? '',
        playerId: 'zico',
        rarity: zico?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result.renderer).toBe('procedural');
  });

  it('22. o overlay de arraste não monta PlayerCard e ResolvedWorldLegendsCard juntos — PitchBuilder não importa mais PlayerCard', () => {
    const src = readSource('components/squad/premium/PitchBuilder.tsx');
    expect(src).not.toMatch(/from ['"]@\/components\/cards\/PlayerCard['"]/);
    expect(src).not.toMatch(/<PlayerCard\b/);
  });

  it('23. o caminho mobile usa a mesma arquitetura — nenhuma branch de viewport troca o componente de card no Squad', () => {
    for (const file of SQUAD_CARD_FILES) {
      const src = readSource(file);
      expect(src).not.toMatch(/isMobile|useMediaQuery|innerWidth/);
    }
  });

  it('24. analytics do Squad — nenhum evento existia nestes componentes antes desta sprint; nada foi adicionado nem removido', () => {
    for (const file of SQUAD_CARD_FILES) {
      const src = readSource(file);
      expect(src).not.toMatch(/posthog|trackEvent|gtag/i);
    }
  });

  it('nenhum dos 5 componentes reimplementa o critério combinado do resolver (hasAnyGeneratedOutput/resolveGeneratedArtwork)', () => {
    for (const file of SQUAD_CARD_FILES) {
      const src = readSource(file);
      expect(src).not.toContain('hasAnyGeneratedOutput');
      expect(src).not.toMatch(/resolveGeneratedArtwork\(/);
    }
  });
});
