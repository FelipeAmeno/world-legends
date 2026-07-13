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

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 37 — Player Details Standard/Showcase integration', () => {
  const collection = getCollection();
  const pele = collection.find((c) => c.playerId === 'pelé');

  it('1. preset válido com output Standard resolve full-artwork Standard', () => {
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
    if (result.renderer === 'full-artwork') {
      const artwork = resolveGeneratedArtwork(CARD_STATIC_MANIFEST, result.preset.id, 'standard');
      expect(artwork).not.toBeNull();
    }
  });

  it('2. densidade Standard mostra nickname', () => {
    const preset = CARD_STATIC_MANIFEST.find((p) => p.id === pele?.artworkPresetId);
    expect(preset).toBeDefined();
    const standardLayout = resolveHudLayout(preset, 'standard');
    expect(shouldShowZone(standardLayout.nickname, 'standard', ['compact'])).toBe(true);
    expect(pele?.nickname).toBe('O REI');
  });

  it('3. densidade Standard expõe os stats esperados (card.stats populado pros 10 pilotos)', () => {
    for (const id of TEN_PILOT_PLAYER_IDS) {
      const card = collection.find((c) => c.playerId === id);
      expect(card?.stats).toBeDefined();
      expect(typeof card?.stats?.pace).toBe('number');
      expect(typeof card?.stats?.finishing).toBe('number');
      expect(typeof card?.stats?.passing).toBe('number');
      expect(typeof card?.stats?.dribbling).toBe('number');
      expect(typeof card?.stats?.defending).toBe('number');
      expect(typeof card?.stats?.physical).toBe('number');
    }
  });

  it('4. output Standard ausente cai no procedural (não usa Compact silenciosamente)', () => {
    const manifest = [
      {
        id: 'wl-no-standard-001',
        generated: {
          compact: { src: '/x/compact.webp', sizeKB: 10 },
          standard: null,
          showcase: { src: '/x/showcase.webp', sizeKB: 30 },
        },
        productionEligible: true,
      },
    ];
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-no-standard-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
      'standard',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'artwork-output-not-found' });
  });

  it('5. productionEligible false cai no procedural em qualquer densidade', () => {
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
    for (const density of ['standard', 'showcase'] as const) {
      const result = resolvePlayerCardRendererForDensity(
        { artworkPresetId: 'wl-draft-001', cardId: 'c', playerId: 'p', rarity: 'r' },
        manifest,
        density,
      );
      expect(result).toEqual({
        renderer: 'procedural',
        fallbackReason: 'preset-not-production-eligible',
      });
    }
  });

  it('6. preset ausente cai no procedural (missing-artwork-preset-id)', () => {
    const result = resolvePlayerCardRendererForDensity(
      { cardId: 'c', playerId: 'p', rarity: 'r' },
      CARD_STATIC_MANIFEST,
      'standard',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' });
  });

  it('7. Showcase não é pedido no render inicial de detalhe — CardFullPage usa density="standard", nunca "showcase"', () => {
    const src = readSource('components/collection/CardFullPage.tsx');
    expect(src).toContain('density="standard"');
    expect(src).not.toMatch(/density=["']showcase["']/);
    expect(src).not.toMatch(/density=["']compact["']/);
  });

  it('8. Showcase só é pedido quando o estado de destaque abre — CardSpotlightModal usa density="showcase", montado só enquanto aberto', () => {
    const src = readSource('components/hall-of-legends/CardSpotlightModal.tsx');
    expect(src).toContain('density="showcase"');
    // CardSpotlightPresence só monta <CardSpotlightModal> quando `card` não é null
    // (AnimatePresence + render condicional) — nunca pré-carrega o asset Showcase.
    expect(src).toMatch(/\{card\s*&&\s*<CardSpotlightModal/);
  });

  it('9. output Showcase ausente cai no procedural com segurança (não usa Standard silenciosamente)', () => {
    const manifest = [
      {
        id: 'wl-no-showcase-001',
        generated: {
          compact: { src: '/x/compact.webp', sizeKB: 10 },
          standard: { src: '/x/standard.webp', sizeKB: 20 },
          showcase: null,
        },
        productionEligible: true,
      },
    ];
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-no-showcase-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
      'showcase',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'artwork-output-not-found' });
    // A MESMA carta, pedindo standard (que existe), resolve full-artwork —
    // prova que o fallback é por densidade, não descarta o preset inteiro.
    const standardResult = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-no-showcase-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
      'standard',
    );
    expect(standardResult.renderer).toBe('full-artwork');
  });

  it('10. ações de detalhe (favoritar, Dream Team, voltar) continuam no código após a integração do renderer', () => {
    const src = readSource('components/collection/CardFullPage.tsx');
    expect(src).toContain('toggleFav');
    expect(src).toContain('toggleDreamTeam');
    expect(src).toContain('toggleFavoriteCardAction');
    expect(src).toContain('<ResolvedWorldLegendsCard');
  });

  it('11. navegação de volta continua funcional — router.back() preservado', () => {
    const src = readSource('components/collection/CardFullPage.tsx');
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*router\.back\(\)\}/);
  });

  it('12. Profile migrou pra ResolvedWorldLegendsCard direto na Sprint 41 (Squad migrou na Sprint 39, Marketplace nunca usou a fachada)', () => {
    const migratedConsumers = [
      'components/profile/premium/BestCardShowcase.tsx',
      'components/profile/premium/FavoriteCards.tsx',
    ];
    for (const file of migratedConsumers) {
      const src = readSource(file);
      expect(src).not.toContain("from '@/components/cards/PlayerCard'");
      expect(src).toContain("from '@/components/cards/ResolvedWorldLegendsCard'");
    }
  });

  it('13. nenhum componente de detalhe importa CARD_STATIC_MANIFEST diretamente', () => {
    const detailFiles = [
      'components/collection/CardFullPage.tsx',
      'components/hall-of-legends/CardSpotlightModal.tsx',
      'app/collection/[cardId]/page.tsx',
    ];
    for (const file of detailFiles) {
      expect(readSource(file)).not.toContain('CARD_STATIC_MANIFEST');
    }
  });

  it('14. nenhum caminho de resolver duplicado — CardFullPage e CardSpotlightModal só usam ResolvedWorldLegendsCard, nunca chamam o resolver direto', () => {
    const detailFiles = [
      'components/collection/CardFullPage.tsx',
      'components/hall-of-legends/CardSpotlightModal.tsx',
    ];
    for (const file of detailFiles) {
      const src = readSource(file);
      expect(src).not.toContain('resolvePlayerCardRenderer(');
      expect(src).not.toContain('resolvePlayerCardRendererForDensity(');
      expect(src).toContain('<ResolvedWorldLegendsCard');
    }
  });

  it('15. os 10 jogadores piloto usam suas próprias URLs de asset Standard', () => {
    const urls = TEN_PILOT_PLAYER_IDS.map((id) => {
      const card = collection.find((c) => c.playerId === id);
      const artwork = resolveGeneratedArtwork(
        CARD_STATIC_MANIFEST,
        card?.artworkPresetId ?? '',
        'standard',
      );
      expect(artwork).not.toBeNull();
      expect(artwork?.src).toContain(card?.artworkPresetId ?? '\0');
      return artwork?.src;
    });
    expect(new Set(urls).size).toBe(TEN_PILOT_PLAYER_IDS.length);
  });

  it('16. os 10 jogadores piloto usam suas próprias URLs de asset Showcase quando o modo showcase está ativo', () => {
    const urls = TEN_PILOT_PLAYER_IDS.map((id) => {
      const card = collection.find((c) => c.playerId === id);
      const artwork = resolveGeneratedArtwork(
        CARD_STATIC_MANIFEST,
        card?.artworkPresetId ?? '',
        'showcase',
      );
      expect(artwork).not.toBeNull();
      expect(artwork?.src).toContain(card?.artworkPresetId ?? '\0');
      return artwork?.src;
    });
    expect(new Set(urls).size).toBe(TEN_PILOT_PLAYER_IDS.length);
  });

  it('resolvePlayerCardRendererForDensity é a única checagem combinada (resolver + densidade específica) — ResolvedWorldLegendsCard não reimplementa o critério', () => {
    const src = readSource('components/cards/ResolvedWorldLegendsCard.tsx');
    expect(src).toContain('resolvePlayerCardRendererForDensity(');
    expect(src).not.toContain('hasAnyGeneratedOutput');
    expect(src).not.toMatch(/resolveGeneratedArtwork\(/);
  });

  it('regressão: /collection/[cardId] resolve cardId com acento (ex. Pelé) — bug pré-existente encontrado e corrigido nesta sprint', () => {
    // O param de rota chegava ainda percent-encoded ("pel%C3%A9-...")
    // porque o Next não decodifica automaticamente dynamic segments com
    // caractere não-ASCII nesta config — catalog.get(rawCardId) nunca
    // batia, então QUALQUER jogador com acento no nome (Pelé) sempre
    // caía em notFound() ao clicar no próprio card na Coleção. Não era
    // um bug introduzido por esta sprint — só foi descoberto ao tentar
    // fazer QA do card piloto real.
    const collection = getCollection();
    const pele = collection.find((c) => c.playerId === 'pelé');
    expect(pele).toBeDefined();
    const rawFromUrl = 'pel%C3%A9-world_cup_hero';
    const decoded = decodeURIComponent(rawFromUrl).normalize('NFC');
    expect(decoded).toBe(pele?.cardId);

    const src = readSource('app/collection/[cardId]/page.tsx');
    expect(src).toContain('decodeURIComponent(rawCardId)');
  });
});
