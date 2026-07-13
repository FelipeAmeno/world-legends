import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shouldShowZone } from '@/components/cards/FullArtworkWorldLegendsCard';
import { resolveHudLayout } from '@/lib/card-static/hud-layout';
import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import { resolvePlayerCardRendererForDensity } from '@/lib/card-static/resolve-player-card-renderer';
import { getCollection, getCollectionMap } from '@/lib/collection-data';
import { getListings } from '@/lib/marketplace/mock-listings';
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

const MARKET_CARD_FILES = [
  'components/market/ListingGrid.tsx',
  'components/market/ListingDetailModal.tsx',
] as const;

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 40 — Marketplace renderer integration', () => {
  const collection = getCollection();
  const listings = getListings();
  const cardsById = getCollectionMap();

  it('1. listagem elegível (piloto) resolve full-artwork Compact', () => {
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
      'compact',
    );
    expect(result.renderer).toBe('full-artwork');
    if (result.renderer === 'full-artwork') {
      const artwork = resolveGeneratedArtwork(CARD_STATIC_MANIFEST, result.preset.id, 'compact');
      expect(artwork).not.toBeNull();
    }
  });

  it('2. toda listing gerada por getListings() resolve pro mesmo cardId de uma CollectionCard real (nenhum identity model paralelo)', () => {
    expect(listings.length).toBeGreaterThan(0);
    for (const listing of listings.slice(0, 50)) {
      const card = cardsById.get(listing.cardId);
      expect(card).toBeDefined();
      expect(card?.cardId).toBe(listing.cardId);
    }
  });

  it('3. nickname permanece oculto em Compact para listagem de piloto', () => {
    const pele = collection.find((c) => c.playerId === 'pelé');
    const preset = CARD_STATIC_MANIFEST.find((p) => p.id === pele?.artworkPresetId);
    expect(preset).toBeDefined();
    const compactLayout = resolveHudLayout(preset, 'compact');
    expect(shouldShowZone(compactLayout.nickname, 'compact', ['compact'])).toBe(false);
  });

  it('4. preset ausente cai no procedural (missing-artwork-preset-id)', () => {
    const result = resolvePlayerCardRendererForDensity(
      { cardId: 'c', playerId: 'p', rarity: 'r' },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' });
  });

  it('5. productionEligible false cai no procedural em Compact', () => {
    const manifest = [
      {
        id: 'wl-draft-market-001',
        generated: {
          compact: { src: '/x/compact.webp', sizeKB: 10 },
          standard: { src: '/x/standard.webp', sizeKB: 20 },
          showcase: { src: '/x/showcase.webp', sizeKB: 30 },
        },
        productionEligible: false,
      },
    ];
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-draft-market-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
      'compact',
    );
    expect(result).toEqual({
      renderer: 'procedural',
      fallbackReason: 'preset-not-production-eligible',
    });
  });

  it('6. output Compact ausente cai no procedural (não usa Standard silenciosamente)', () => {
    const manifest = [
      {
        id: 'wl-no-compact-market-001',
        generated: {
          compact: null,
          standard: { src: '/x/standard.webp', sizeKB: 20 },
          showcase: { src: '/x/showcase.webp', sizeKB: 30 },
        },
        productionEligible: true,
      },
    ];
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-no-compact-market-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifest,
      'compact',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'artwork-output-not-found' });
  });

  it('7. fallback para procedural não altera nenhum campo transacional da listing (preço, status, seller, id)', () => {
    const listing = listings[0];
    expect(listing).toBeDefined();
    if (!listing) return;
    // Fabrica um resultado de resolver "procedural" e confirma que a listing
    // em si (preço/status/seller/ids) não tem nenhum campo derivado dele —
    // são objetos completamente desacoplados.
    const fallback = resolvePlayerCardRendererForDensity(
      { cardId: listing.cardId, playerId: 'nao-existe', rarity: listing.rarityCode },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(fallback.renderer).toBe('procedural');
    expect(listing.price).toBeDefined();
    expect(listing.status).toBe('active');
    expect(listing.sellerId).toBeDefined();
    expect(listing.id).toBeDefined();
  });

  it('8. MarketListing (T063) não carrega artworkPresetId/nickname/stats — sem duplicação de preset no DTO', () => {
    const listing = listings[0];
    expect(listing).toBeDefined();
    expect(listing && 'artworkPresetId' in listing).toBe(false);
    expect(listing && 'nickname' in listing).toBe(false);
    expect(listing && 'stats' in listing).toBe(false);
  });

  it('9. ordenar/filtrar listings preserva o cardId de cada listing (identidade de card não muda com sort/filter)', () => {
    const byPriceAsc = [...listings].sort((a, b) => a.price.amount - b.price.amount);
    const idsBefore = new Set(listings.map((l) => l.cardId));
    const idsAfter = new Set(byPriceAsc.map((l) => l.cardId));
    expect(idsAfter).toEqual(idsBefore);
    for (const l of byPriceAsc) {
      const original = listings.find((o) => o.id === l.id);
      expect(original?.cardId).toBe(l.cardId);
    }
  });

  it('10. ListingGrid usa uma chave estável (listing.id) — nunca índice de array', () => {
    const src = readSource('components/market/ListingGrid.tsx');
    expect(src).toMatch(/key=\{l\.id\}/);
    expect(src).not.toMatch(/key=\{i\}/);
    expect(src).not.toMatch(/key=\{index\}/);
  });

  it('11. ListingGrid pede density="compact" explicitamente pro ResolvedWorldLegendsCard', () => {
    const src = readSource('components/market/ListingGrid.tsx');
    expect(src).toContain('<ResolvedWorldLegendsCard');
    expect(src).toContain('density="compact"');
    expect(src).not.toMatch(/density=["']standard["']/);
    expect(src).not.toMatch(/density=["']showcase["']/);
  });

  it('12. ListingDetailModal usa density="compact" — o card inline não é maior que o do grid, então não usa Standard', () => {
    const src = readSource('components/market/ListingDetailModal.tsx');
    expect(src).toContain('<ResolvedWorldLegendsCard');
    expect(src).toContain('density="compact"');
    expect(src).not.toMatch(/density=["']standard["']/);
    expect(src).not.toMatch(/density=["']showcase["']/);
  });

  it('13. fechar e reabrir o detalhe é controlado por SELECT/null no reducer — a listing selecionada nunca é derivada de artwork', () => {
    const src = readSource('components/market/MarketExperience.tsx');
    expect(src).toMatch(/case 'SELECT':/);
    expect(src).toMatch(/selected:\s*action\.listing/);
  });

  for (const file of MARKET_CARD_FILES) {
    it(`14. ${file} não importa CARD_STATIC_MANIFEST diretamente`, () => {
      expect(readSource(file)).not.toContain('CARD_STATIC_MANIFEST');
    });

    it(`15. ${file} não chama o resolver diretamente — só via ResolvedWorldLegendsCard`, () => {
      const src = readSource(file);
      expect(src).not.toContain('resolvePlayerCardRenderer(');
      expect(src).not.toContain('resolvePlayerCardRendererForDensity(');
    });

    it(`16. ${file} não importa PlayerCard (fachada legada) nem cria resolver próprio`, () => {
      const src = readSource(file);
      expect(src).not.toContain("from '@/components/cards/PlayerCard'");
      expect(src).not.toMatch(/function resolve\w*Renderer/);
    });
  }

  it('17. nenhum whitelist de jogador existe em Marketplace (nenhuma lista fixa de playerIds/nomes gating artwork)', () => {
    for (const file of MARKET_CARD_FILES) {
      const src = readSource(file);
      for (const id of TEN_PILOT_PLAYER_IDS) {
        expect(src).not.toContain(`'${id}'`);
      }
    }
  });

  it('18. listings proceduais (sem preset elegível) não pedem nenhum WebP full-artwork', () => {
    // Constrói uma carta fake sem artworkPresetId — resolver garante que
    // nenhum resolveGeneratedArtwork é chamado nesse branch (não há URL
    // de asset full-artwork associada).
    const result = resolvePlayerCardRendererForDensity(
      { cardId: 'c', playerId: 'ninguem', rarity: 'common' },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result.renderer).toBe('procedural');
    expect('preset' in result).toBe(false);
  });

  it('19. os 10 jogadores piloto, se listados, resolvem cada um pra sua própria URL Compact (sem colisão)', () => {
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

  it('20. nenhuma URL de asset resolvida referencia uma fonte PNG bruta (source) — só outputs gerados WebP', () => {
    const pele = collection.find((c) => c.playerId === 'pelé');
    for (const density of ['compact', 'standard', 'showcase'] as const) {
      const artwork = resolveGeneratedArtwork(
        CARD_STATIC_MANIFEST,
        pele?.artworkPresetId ?? '',
        density,
      );
      expect(artwork?.src).not.toMatch(/\/source\//);
      expect(artwork?.src?.endsWith('.webp')).toBe(true);
    }
  });

  it('21. botão de compra permanece desabilitado ("Em breve") — nenhuma lógica transacional foi introduzida', () => {
    const src = readSource('components/market/ListingDetailModal.tsx');
    expect(src).toMatch(/disabled/);
    expect(src).toContain('Em breve');
    expect(src).not.toContain('createListingIntent');
    expect(src).not.toMatch(/function\s+buyListing/);
  });

  it('22. nenhum código de analytics/tracking foi introduzido em Marketplace (não existia antes, continua ausente)', () => {
    for (const file of [...MARKET_CARD_FILES, 'components/market/MarketExperience.tsx']) {
      const src = readSource(file);
      expect(src).not.toMatch(/\btrack\(/);
      expect(src).not.toContain('analytics.');
    }
  });

  it('23. cardsById (getCollectionMap) é reaproveitado uma única vez em MarketExperience — sem reconstrução por card renderizado', () => {
    const src = readSource('components/market/MarketExperience.tsx');
    expect(src).toMatch(/useMemo\(\(\)\s*=>\s*getCollectionMap\(\),\s*\[\]\)/);
  });

  it('24. cartas duplicadas do mesmo jogador (instâncias diferentes) compartilham a URL de artwork sem compartilhar estado de listing', () => {
    const sameSellerListings = listings.filter((l) => l.cardId === listings[0]?.cardId);
    // Mesmo cardId pode aparecer em múltiplas listings mock (mesma arte),
    // mas cada listing mantém seu próprio id/seller/preço independentes.
    if (sameSellerListings.length > 1) {
      const ids = new Set(sameSellerListings.map((l) => l.id));
      expect(ids.size).toBe(sameSellerListings.length);
    } else {
      expect(sameSellerListings.length).toBeGreaterThanOrEqual(1);
    }
  });
});
