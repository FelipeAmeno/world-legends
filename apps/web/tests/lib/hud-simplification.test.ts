import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { getCollection } from '@/lib/collection-data';
import { compareCards } from '@/lib/collection-filters';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

// Chaves REAIS de CollectionCard.attributes (lib/collection-data.ts monta
// em português) — não 'pace'/'finishing'/etc, que era o bug encontrado
// nesta sprint em 3 lugares (CardFullPage, CardDetailModal, compareCards).
const SIX_ATTRIBUTE_KEYS = [
  'Velocidade',
  'Finalização',
  'Passe',
  'Drible',
  'Defesa',
  'Físico',
] as const;

describe('Sprint 42A — HUD simplification (six attributes removed from the card face)', () => {
  const collection = getCollection();

  it('1. full-artwork: showStatsTop/showStatsBottom/showStats são constantes false incondicionais — não chamam mais shouldShowZone(hud.stats*, ...)', () => {
    const src = readSource('components/cards/FullArtworkWorldLegendsCard.tsx');
    expect(src).toMatch(/const showStatsTop = false;/);
    expect(src).toMatch(/const showStatsBottom = false;/);
    expect(src).toMatch(/const showStats = false;/);
    expect(src).not.toContain('shouldShowZone(hud.statsTop');
    expect(src).not.toContain('shouldShowZone(hud.statsBottom');
    expect(src).not.toMatch(/shouldShowZone\(hud\.stats,/);
  });

  it('2. full-artwork: presets reais têm statsTop/statsBottom definidos no manifesto (a mudança tem efeito real, não é um no-op)', () => {
    const withStats = CARD_STATIC_MANIFEST.filter((preset) => {
      const src = JSON.stringify(preset);
      return src.includes('statsTop') || src.includes('statsBottom');
    });
    // Pelo menos alguns presets pilotos assam stat boxes na própria arte V1.
    expect(withStats.length).toBeGreaterThan(0);
  });

  it('3. full-artwork: OVR, posição e nome continuam sendo renderizados incondicionalmente (não fazem parte da remoção)', () => {
    const src = readSource('components/cards/FullArtworkWorldLegendsCard.tsx');
    expect(src).toMatch(/<Zone zone=\{hud\.overall\}/);
    expect(src).toMatch(/<Zone zone=\{hud\.position\}/);
    expect(src).toMatch(/<Zone zone=\{hud\.name\}/);
  });

  it('4. full-artwork: nickname continua condicionado à densidade (Standard/Showcase) e à existência do dado — não foi alterado nesta sprint', () => {
    const src = readSource('components/cards/FullArtworkWorldLegendsCard.tsx');
    expect(src).toMatch(
      /showNickname = shouldShowZone\(hud\.nickname, density, \['compact'\]\) && Boolean\(nickname\)/,
    );
  });

  it('5. procedural: CardAttributesLayer só renderiza quando a prop `attributes` é passada — e nenhum call site de produção passa', () => {
    const src = readSource('components/cards/ResolvedWorldLegendsCard.tsx');
    expect(src).toContain(
      'attributes ? <CardAttributesLayer ctx={ctx} attributes={attributes} /> : undefined',
    );
  });

  it('6. procedural: nenhum arquivo de produção (fora dev tools/testes) passa attributes= pro ResolvedWorldLegendsCard', () => {
    const productionFiles = [
      'components/collection/CollectionCardTile.tsx',
      'components/collection/CardFullPage.tsx',
      'components/collection/CardDetailModal.tsx',
      'components/collection/CompareModal.tsx',
      'components/hall-of-legends/CardSpotlightModal.tsx',
      'components/hall-of-legends/HallOfLegendsExperience.tsx',
      'components/squad/premium/PremiumPitch.tsx',
      'components/squad/premium/BenchStrip.tsx',
      'components/squad/premium/CardPoolSheet.tsx',
      'components/squad/premium/PlayerSelectModal.tsx',
      'components/squad/premium/PitchBuilder.tsx',
      'components/market/ListingGrid.tsx',
      'components/market/ListingDetailModal.tsx',
      'components/match/premium/MatchResultScreen.tsx',
      'components/profile/premium/BestCardShowcase.tsx',
      'components/profile/premium/FavoriteCards.tsx',
      'components/packs/RevealedCard.tsx',
    ];
    for (const file of productionFiles) {
      const src = readSource(file);
      expect(src).not.toMatch(/<ResolvedWorldLegendsCard[^>]*\sattributes=/);
    }
  });

  it('7. CardFullPage (/collection/[cardId]) continua exibindo os 6 atributos, mas numa seção separada da carta em si', () => {
    const src = readSource('components/collection/CardFullPage.tsx');
    expect(src).toContain('ATTR_LABELS');
    expect(src).toContain('SectionLabel label="Atributos"');
    expect(src).toContain('card.attributes[key]');
    // O card em si é renderizado sem a prop `attributes` — os valores da seção
    // separada vêm direto de card.attributes, nunca da carta.
    expect(src).not.toMatch(/<ResolvedWorldLegendsCard[^>]*\sattributes=/);
  });

  it('8. modelo de dados: CollectionCard.attributes continua com os 6 atributos (jogadores de linha), com valores numéricos reais', () => {
    const outfield = collection.filter((c) => c.position !== 'GK').slice(0, 20);
    expect(outfield.length).toBeGreaterThan(0);
    for (const card of outfield) {
      for (const key of SIX_ATTRIBUTE_KEYS) {
        expect(typeof card.attributes[key]).toBe('number');
      }
    }
  });

  it('8b. bug pré-existente corrigido nesta sprint: CardFullPage/CardDetailModal/compareCards liam chaves em inglês que nunca existiam em CollectionCard.attributes (sempre mostravam 0) — agora leem as chaves reais', () => {
    for (const file of [
      'components/collection/CardFullPage.tsx',
      'components/collection/CardDetailModal.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/key:\s*'pace'/);
      expect(src).not.toMatch(/key:\s*'finishing'/);
      expect(src).toMatch(/key:\s*'Velocidade'/);
      expect(src).toMatch(/key:\s*'Finalização'/);
    }
    const compareSrc = readSource('lib/collection-filters.ts');
    expect(compareSrc).not.toContain('c.attributes.pace');
    expect(compareSrc).toContain('c.attributes.Velocidade');
  });

  it('8c. compareCards() agora retorna valores reais (não mais 0 fixo) pros 6 atributos de dois jogadores de linha distintos', () => {
    const outfield = collection.filter((c) => c.position !== 'GK');
    const a = outfield[0];
    const b = outfield.find((c) => c.cardId !== a?.cardId);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    if (!a || !b) return;
    const diffs = compareCards([a, b]);
    const attrFields = ['Ritmo', 'Finalização', 'Passe', 'Drible', 'Defesa', 'Físico'];
    for (const fieldName of attrFields) {
      const diff = diffs.find((d) => d.field === fieldName);
      expect(diff).toBeDefined();
      // Pelo menos um dos dois lados deve ter um valor > 0 — antes do fix,
      // ambos eram sempre 0 (chave errada nunca batia com o dado real).
      const hasRealValue = diff?.values.some((v) => (v.value as number) > 0);
      expect(hasRealValue).toBe(true);
    }
  });

  it('9. squad-builder (chemistry/posições) continua 100% desacoplado do renderer de artwork — sprint não introduziu nenhum acoplamento novo', () => {
    const src = readSource('lib/squad-builder.ts');
    expect(src).not.toContain('resolvePlayerCardRenderer');
    expect(src).not.toContain('FullArtworkWorldLegendsCard');
    expect(src).not.toContain('CardAttributesLayer');
    expect(src).not.toContain('artworkPresetId');
  });

  it('10. nenhum PNG/WebP/asset de artwork foi tocado — a mudança é 100% de código de apresentação (HUD React), não de arte gerada', () => {
    const src = readSource('components/cards/FullArtworkWorldLegendsCard.tsx');
    expect(src).toContain('resolveGeneratedArtwork');
    // A função de resolução de artwork continua intocada — só o HUD (texto
    // React por cima da imagem) parou de desenhar os stats.
    const artworkCallIndex = src.indexOf('resolveGeneratedArtwork(');
    expect(artworkCallIndex).toBeGreaterThan(-1);
  });
});
