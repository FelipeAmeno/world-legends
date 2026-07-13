import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import { resolvePlayerCardRendererForDensity } from '@/lib/card-static/resolve-player-card-renderer';
import { getCollection } from '@/lib/collection-data';
import { describe, expect, it } from 'vitest';

// world_cup_hero (GoatReveal path) vs ultra/elite (RevealedCard path) —
// confirmado por leitura direta do catálogo real antes de escrever este
// arquivo (8 dos 10 pilotos são world_cup_hero, só 2 são ultra).
const GOAT_PATH_PILOTS = [
  'pelé',
  'maradona',
  'lionel-messi',
  'cristiano-ronaldo',
  'neymar',
  'kylian-mbappe',
  'zinedine-zidane',
  'franz-beckenbauer',
] as const;
const NORMAL_PATH_PILOTS = ['ronaldinho', 'ronaldo'] as const;

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 38 — Pack Reveal renderer integration (RevealedCard, caminho normal)', () => {
  const collection = getCollection();

  it('1. jogador elegível resolve full-artwork Standard no reveal final', () => {
    for (const id of NORMAL_PATH_PILOTS) {
      const card = collection.find((c) => c.playerId === id);
      expect(card).toBeDefined();
      const result = resolvePlayerCardRendererForDensity(
        {
          artworkPresetId: card?.artworkPresetId,
          cardId: card?.cardId ?? '',
          playerId: id,
          rarity: card?.rarityCode ?? '',
        },
        CARD_STATIC_MANIFEST,
        'standard',
      );
      expect(result.renderer).toBe('full-artwork');
    }
  });

  it('2. preset ausente cai no procedural (missing-artwork-preset-id)', () => {
    const result = resolvePlayerCardRendererForDensity(
      { cardId: 'c', playerId: 'p', rarity: 'common' },
      CARD_STATIC_MANIFEST,
      'standard',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' });
  });

  it('3. densidade Standard ausente cai no procedural (não usa Compact silenciosamente)', () => {
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

  it('4. RevealedCard pede só a densidade Standard no código-fonte (nunca compact/showcase)', () => {
    const src = readSource('components/packs/RevealedCard.tsx');
    expect(src).toContain('density="standard"');
    expect(src).not.toMatch(/density=["']compact["']/);
    expect(src).not.toMatch(/density=["']showcase["']/);
  });

  it('5. RevealedCard não importa CARD_STATIC_MANIFEST diretamente', () => {
    const src = readSource('components/packs/RevealedCard.tsx');
    expect(src).not.toContain('CARD_STATIC_MANIFEST');
  });

  it('6. RevealedCard não chama o resolver diretamente — só via ResolvedWorldLegendsCard', () => {
    const src = readSource('components/packs/RevealedCard.tsx');
    expect(src).not.toContain('resolvePlayerCardRenderer(');
    expect(src).not.toContain('resolvePlayerCardRendererForDensity(');
    expect(src).toContain('<ResolvedWorldLegendsCard');
  });
});

describe('Sprint 38 — Pack Reveal renderer integration (GoatReveal, caminho world_cup_hero)', () => {
  const collection = getCollection();

  it('7. jogador GOAT elegível resolve full-artwork Showcase na fase final', () => {
    for (const id of GOAT_PATH_PILOTS) {
      const card = collection.find((c) => c.playerId === id);
      expect(card).toBeDefined();
      const result = resolvePlayerCardRendererForDensity(
        {
          artworkPresetId: card?.artworkPresetId,
          cardId: card?.cardId ?? '',
          playerId: id,
          rarity: card?.rarityCode ?? '',
        },
        CARD_STATIC_MANIFEST,
        'showcase',
      );
      expect(result.renderer).toBe('full-artwork');
    }
  });

  it('8. o card resolvido só está dentro do bloco condicional card/burst/hold — nunca nas fases dark/text', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    // Só deve haver UMA ocorrência de <ResolvedWorldLegendsCard, e ela
    // precisa estar depois do gate `(phase === 'card' || phase === 'burst' || phase === 'hold')`.
    const gateIdx = src.indexOf("phase === 'card' || phase === 'burst' || phase === 'hold'");
    const cardCompIdx = src.indexOf('<ResolvedWorldLegendsCard');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(cardCompIdx).toBeGreaterThan(gateIdx);
    expect(src.match(/<ResolvedWorldLegendsCard/g)?.length).toBe(1);
  });

  it("9. nome/nickname/stats não aparecem nas fases 'dark'/'text' — nenhum markup manual de identidade sobrou fora do bloco resolvido", () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    // O markup bespoke antigo (OVR/nome/bandeira em texto puro) foi
    // removido — a única fonte de identidade agora é o card resolvido.
    expect(src).not.toMatch(/\{card\.card\.overall\}/);
    expect(src).not.toMatch(/\{card\.card\.displayName\}/);
    expect(src).not.toMatch(/\{card\.card\.flagEmoji\}/);
    expect(src).not.toContain('nameLetters');
  });

  it('10-11. skip não rechama nem reordena a recompensa — handleTap só transiciona fase, nunca busca/reatribui `card`', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    // `card` vem só das props (`{ card, onComplete }: Props`, destructuring),
    // nunca reatribuído — o único padrão "card=" no arquivo é a prop JSX
    // `card={card.card}`, sempre seguida de `{` (nunca reatribuição).
    expect(src).not.toMatch(/\blet\s+card\b/);
    expect(src).not.toMatch(/\bcard\s*=\s*[^{]/);
    // handleTap só mexe em fase/timers, nenhuma chamada de rede/mutação.
    const handleTapMatch = src.match(
      /const handleTap = useCallback\(\(\) => \{[\s\S]*?\n {2}\}, \[/,
    );
    expect(handleTapMatch).toBeTruthy();
    const handleTapBody = handleTapMatch?.[0] ?? '';
    expect(handleTapBody).not.toMatch(/fetch\(|Action\(|await /);
  });

  it('12. reduced motion — limitação pré-existente documentada (nenhum tratamento existia antes ou depois desta sprint)', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    expect(src).not.toContain('prefers-reduced-motion');
    expect(src).not.toContain('useReducedMotion');
    // Ver relatório da Sprint 38, seção "Limitações conhecidas" — não é
    // regressão desta sprint, é o estado herdado do componente.
  });

  it('13. output Showcase ausente cai no procedural com segurança', () => {
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
  });

  it('14. fallback não interrompe a cinemática — ResolvedWorldLegendsCard é incondicional dentro do bloco card/burst/hold (o próprio componente decide full-artwork vs. procedural, nunca lança nem bloqueia)', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    // Ancora no comentário exclusivo do bloco da carta (não reaparece em
    // nenhum outro dos blocos condicionais que reusam a mesma expressão
    // de fase — aura, grade dourada, etc.).
    const cardBlockStart = src.indexOf('Fase: card + burst + hold');
    expect(cardBlockStart).toBeGreaterThan(-1);
    const snippet = src.slice(cardBlockStart, cardBlockStart + 2500);
    expect(snippet).toContain('<ResolvedWorldLegendsCard');
    // Não existe nenhum `if (resolution...)`/try-catch em volta — a
    // decisão fica 100% dentro do componente compartilhado.
    expect(snippet).not.toMatch(/try\s*\{/);
  });

  it('15. persistência da recompensa é anterior à animação — GoatReveal não chama nenhuma action/persistência (achado da descoberta: o servidor já commitou antes da fase REVEAL montar)', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    expect(src).not.toContain('openPackAction');
    expect(src).not.toContain('cardRepo');
    expect(src).not.toContain('debitSoftCurrency');
  });

  it('16. eventos de analytics — nenhum existia antes desta sprint (achado da descoberta), nada foi adicionado nem removido', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    expect(src).not.toMatch(/posthog|trackEvent|gtag|analytics/i);
  });

  it('17. gatilhos de som/haptics preservados (SFX.cardGoat, vibrate)', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    expect(src).toContain('SFX.cardGoat');
    expect(src).toContain("vibrate('cardGoat')");
    expect(src).toContain("vibrate('packCharge')");
  });

  it('18. GoatReveal pede só a densidade Showcase (nunca compact/standard) no código-fonte', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    expect(src).toContain('density="showcase"');
    expect(src).not.toMatch(/density=["']compact["']/);
    expect(src).not.toMatch(/density=["']standard["']/);
  });

  it('19. GoatReveal não importa CARD_STATIC_MANIFEST nem chama o resolver diretamente', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    expect(src).not.toContain('CARD_STATIC_MANIFEST');
    expect(src).not.toContain('resolvePlayerCardRenderer(');
    expect(src).not.toContain('resolvePlayerCardRendererForDensity(');
  });

  it('20. markup bespoke do card final foi removido — não fica montado junto do ResolvedWorldLegendsCard', () => {
    const src = readSource('components/packs/GoatReveal.tsx');
    expect(src).not.toContain('World Cup Hero');
    expect(src).not.toMatch(/Nome do jogador \(hold/);
    // "LENDA SUPREMA" é um label decorativo FORA do card (abaixo dele),
    // não é identidade do jogador — continua existindo de propósito.
    expect(src).toContain('LENDA SUPREMA');
  });
});

describe('Sprint 38 — os 10 pilotos, cada um pelo seu caminho de reveal aplicável', () => {
  const collection = getCollection();

  it('21. todos os 10 pilotos resolvem pra URLs de artwork próprias, na densidade do caminho que realmente usam', () => {
    const urls: string[] = [];
    for (const id of GOAT_PATH_PILOTS) {
      const card = collection.find((c) => c.playerId === id);
      const artwork = resolveGeneratedArtwork(
        CARD_STATIC_MANIFEST,
        card?.artworkPresetId ?? '',
        'showcase',
      );
      expect(artwork).not.toBeNull();
      expect(artwork?.src).toContain(card?.artworkPresetId ?? '\0');
      urls.push(artwork?.src ?? '');
    }
    for (const id of NORMAL_PATH_PILOTS) {
      const card = collection.find((c) => c.playerId === id);
      const artwork = resolveGeneratedArtwork(
        CARD_STATIC_MANIFEST,
        card?.artworkPresetId ?? '',
        'standard',
      );
      expect(artwork).not.toBeNull();
      expect(artwork?.src).toContain(card?.artworkPresetId ?? '\0');
      urls.push(artwork?.src ?? '');
    }
    expect(new Set(urls).size).toBe(10);
  });

  it('procedural: jogador sem preset não pede nenhum asset full-artwork em nenhum dos dois caminhos', () => {
    const zico = collection.find((c) => c.playerId === 'zico');
    expect(zico?.artworkPresetId).toBeUndefined();
    for (const density of ['standard', 'showcase'] as const) {
      const result = resolvePlayerCardRendererForDensity(
        {
          artworkPresetId: zico?.artworkPresetId,
          cardId: zico?.cardId ?? '',
          playerId: 'zico',
          rarity: zico?.rarityCode ?? '',
        },
        CARD_STATIC_MANIFEST,
        density,
      );
      expect(result.renderer).toBe('procedural');
    }
  });

  it('nenhum componente de Pack Reveal contém whitelist de jogador hardcoded', () => {
    const files = ['components/packs/RevealedCard.tsx', 'components/packs/GoatReveal.tsx'];
    const forbidden = [
      'pelé',
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

  it('resolvePlayerCardRendererForDensity não é reimplementado em nenhum dos dois componentes de reveal', () => {
    for (const file of ['components/packs/RevealedCard.tsx', 'components/packs/GoatReveal.tsx']) {
      const src = readSource(file);
      expect(src).not.toContain('hasAnyGeneratedOutput');
      expect(src).not.toMatch(/resolveGeneratedArtwork\(/);
    }
  });
});
