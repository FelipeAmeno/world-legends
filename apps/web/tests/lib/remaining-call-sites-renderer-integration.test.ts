import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import { resolvePlayerCardRendererForDensity } from '@/lib/card-static/resolve-player-card-renderer';
import { getCollection } from '@/lib/collection-data';
import { compareCards } from '@/lib/collection-filters';
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

// Sprint 41 — cada arquivo migrado nesta sprint, com a densidade explícita
// que foi escolhida (documentado no relatório da sprint junto do porquê).
const MIGRATED_FILES: Record<string, 'compact' | 'standard' | 'showcase'> = {
  'components/collection/CardDetailModal.tsx': 'showcase',
  'components/collection/CompareModal.tsx': 'compact',
  'components/match/premium/MatchResultScreen.tsx': 'showcase',
  'components/profile/premium/BestCardShowcase.tsx': 'standard',
  'components/profile/premium/FavoriteCards.tsx': 'compact',
};

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 41 — remaining PlayerCard call sites migrated to ResolvedWorldLegendsCard', () => {
  const collection = getCollection();

  it('1. Profile (BestCardShowcase) — carta elegível resolve full-artwork Standard', () => {
    const pele = collection.find((c) => c.playerId === 'pelé');
    expect(pele).toBeDefined();
    const result = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: pele?.artworkPresetId,
        cardId: pele?.cardId ?? '',
        playerId: 'pelé',
        rarity: pele?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
      'standard',
    );
    expect(result.renderer).toBe('full-artwork');
  });

  it('2. Profile — jogador sem preset cai no procedural (fallback seguro)', () => {
    const result = resolvePlayerCardRendererForDensity(
      { cardId: 'c', playerId: 'ninguem', rarity: 'common' },
      CARD_STATIC_MANIFEST,
      'standard',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' });
  });

  it('3. Compare — os dois lados resolvem independentemente (cardIds diferentes, resultados não se misturam)', () => {
    const pele = collection.find((c) => c.playerId === 'pelé');
    const semPreset = collection.find((c) => !c.artworkPresetId);
    expect(pele).toBeDefined();
    expect(semPreset).toBeDefined();

    const left = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: pele?.artworkPresetId,
        cardId: pele?.cardId ?? '',
        playerId: pele?.playerId ?? '',
        rarity: pele?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    const right = resolvePlayerCardRendererForDensity(
      {
        artworkPresetId: semPreset?.artworkPresetId,
        cardId: semPreset?.cardId ?? '',
        playerId: semPreset?.playerId ?? '',
        rarity: semPreset?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(left.renderer).toBe('full-artwork');
    expect(right.renderer).toBe('procedural');
  });

  it('4. Compare — compareCards() é puramente numérico, nunca lê artworkPresetId/renderer', () => {
    const src = readSource('lib/collection-filters.ts');
    const fnStart = src.indexOf('export function compareCards');
    const fnBody = src.slice(fnStart, fnStart + 2500);
    expect(fnBody).not.toContain('artworkPresetId');
    expect(fnBody).not.toContain('resolvePlayerCardRenderer');
    expect(fnBody).not.toContain('.renderer');
  });

  it('5. Compare — cálculo de diffs não muda com jogadores diferentes/trocados (determinístico pelos dados, não pela arte)', () => {
    const pele = collection.find((c) => c.playerId === 'pelé');
    const messi = collection.find((c) => c.playerId === 'lionel-messi');
    expect(pele).toBeDefined();
    expect(messi).toBeDefined();
    if (!pele || !messi) return;
    const diffsA = compareCards([pele, messi]);
    const diffsB = compareCards([pele, messi]);
    expect(diffsA).toEqual(diffsB);
    // Trocar a ordem dos lados não muda o conjunto de campos comparados
    const diffsSwapped = compareCards([messi, pele]);
    expect(diffsSwapped.map((d) => d.field)).toEqual(diffsA.map((d) => d.field));
  });

  it('6. CompareModal usa listing.cardId / card.cardId como key — nunca índice', () => {
    const src = readSource('components/collection/CompareModal.tsx');
    expect(src).toMatch(/key=\{card\.cardId\}/);
  });

  it('7. MatchResultScreen (MVP) — reveal só monta a carta quando mvpPhase !== "hidden" (não remonta a cada tick/evento)', () => {
    const src = readSource('components/match/premium/MatchResultScreen.tsx');
    expect(src).toMatch(/mvpPhase\s*!==\s*['"]hidden['"]/);
    expect(src).toContain('<ResolvedWorldLegendsCard');
  });

  it('8. MatchResultScreen — display.mvp é CollectionCard | null vindo de match-data.ts, resolução de artwork não influencia esse valor', () => {
    const src = readSource('lib/match-data.ts');
    expect(src).toContain('mvp: CollectionCard | null');
    expect(src).not.toContain('resolvePlayerCardRenderer');
    expect(src).not.toContain('artworkPresetId');
  });

  it('9. Hall of Legends — a grade do museu já usa ResolvedWorldLegendsCard (Sprint 36) e não importa mais a fachada PlayerCard (import morto removido na Sprint 41)', () => {
    const src = readSource('components/hall-of-legends/HallOfLegendsExperience.tsx');
    expect(src).toContain('<ResolvedWorldLegendsCard');
    expect(src).not.toContain("from '@/components/cards/PlayerCard'");
  });

  it('10. Hall of Legends — comportamento de favoritar/comparar preservado após remover o import morto', () => {
    const src = readSource('components/hall-of-legends/HallOfLegendsExperience.tsx');
    expect(src).toContain('toggleFavoriteCardAction');
    expect(src).toContain('onToggleCompare');
    expect(src).toContain('CompareModal');
  });

  for (const [file, density] of Object.entries(MIGRATED_FILES)) {
    it(`11. ${file} usa density="${density}" explicitamente`, () => {
      const src = readSource(file);
      expect(src).toContain('<ResolvedWorldLegendsCard');
      expect(src).toContain(`density="${density}"`);
    });

    it(`12. ${file} não importa mais a fachada PlayerCard`, () => {
      const src = readSource(file);
      expect(src).not.toContain("from '@/components/cards/PlayerCard'");
    });

    it(`13. ${file} não importa CARD_STATIC_MANIFEST diretamente`, () => {
      expect(readSource(file)).not.toContain('CARD_STATIC_MANIFEST');
    });

    it(`14. ${file} não chama o resolver diretamente`, () => {
      const src = readSource(file);
      expect(src).not.toContain('resolvePlayerCardRenderer(');
      expect(src).not.toContain('resolvePlayerCardRendererForDensity(');
    });
  }

  it('15. nenhum whitelist de jogador existe nos arquivos migrados nesta sprint', () => {
    for (const file of Object.keys(MIGRATED_FILES)) {
      const src = readSource(file);
      for (const id of TEN_PILOT_PLAYER_IDS) {
        expect(src).not.toContain(`'${id}'`);
      }
    }
  });

  it('16. os 10 jogadores piloto resolvem cada um pra sua própria URL Standard e Showcase (sem colisão)', () => {
    for (const density of ['standard', 'showcase'] as const) {
      const urls = TEN_PILOT_PLAYER_IDS.map((id) => {
        const card = collection.find((c) => c.playerId === id);
        const artwork = resolveGeneratedArtwork(
          CARD_STATIC_MANIFEST,
          card?.artworkPresetId ?? '',
          density,
        );
        expect(artwork).not.toBeNull();
        return artwork?.src;
      });
      expect(new Set(urls).size).toBe(TEN_PILOT_PLAYER_IDS.length);
    }
  });

  it('17. jogador procedural (sem preset) não tem nenhuma URL de artwork full-artwork associada', () => {
    const result = resolvePlayerCardRendererForDensity(
      { cardId: 'c', playerId: 'ninguem', rarity: 'common' },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result.renderer).toBe('procedural');
    expect('preset' in result).toBe(false);
  });

  it('18. nenhuma das telas migradas nesta sprint importa a fachada PlayerCard (repetição de garantia — auditoria final)', () => {
    for (const file of Object.keys(MIGRATED_FILES)) {
      expect(readSource(file)).not.toMatch(/import\s*\{\s*PlayerCard\s*\}/);
    }
  });

  it('19. PlayerCard.tsx (a fachada) continua existindo — Sprint 41 não remove o componente', () => {
    expect(() => readSource('components/cards/PlayerCard.tsx')).not.toThrow();
    const src = readSource('components/cards/PlayerCard.tsx');
    expect(src).toContain('export function PlayerCard');
  });

  it('20. ferramentas dev que existem especificamente pra testar PlayerCard continuam importando a fachada de propósito (não migradas)', () => {
    const devTools = [
      'components/dev/CardPreviewPanel.tsx',
      'components/dev/CardStressTestGrid.tsx',
      'components/dev/CardV3Gallery.tsx',
      'components/dev/StaticCardPipelineComparison.tsx',
    ];
    for (const file of devTools) {
      const src = readSource(file);
      // CardV3Gallery/CardStressTestGrid/CardPreviewPanel usam o alias '@/'; StaticCardPipelineComparison usa import relativo ('../cards/PlayerCard') — ambos válidos, ambos preservam o import da fachada.
      expect(src).toMatch(
        /from ['"](@\/components\/cards\/PlayerCard|\.\.\/cards\/PlayerCard)['"]/,
      );
    }
  });
});
