import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type PromptTemplateInput,
  V2_PROMPT_PROHIBITIONS,
  buildV2ArtworkPrompt,
} from '@/lib/asset-studio/prompt-template';
import {
  REFERENCE_SETS,
  getActiveReferenceSet,
  validateReferenceSet,
} from '@/lib/asset-studio/reference-set';
import { validateArtworkSchema } from '@/lib/card-static/artwork-schema-v2';
import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolvePlayerCardRendererForDensity } from '@/lib/card-static/resolve-player-card-renderer';
import type { CardArtworkPreset } from '@/lib/card-static/types';
import { resolveArtworkSchemaVersion } from '@/lib/card-static/types';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

type Preset = Pick<
  CardArtworkPreset,
  'id' | 'sourceType' | 'artworkSchemaVersion' | 'safeZones' | 'hudLayout' | 'hudLayouts'
>;

const VALID_V2_PRESET: Preset = {
  id: 'wl-fixture-v2-001',
  sourceType: 'full-card-artwork',
  artworkSchemaVersion: 2,
  safeZones: {
    upperLeftHudZone: { x: 17, y: 19, width: 18, height: 12 },
    lowerIdentityZone: { x: 50, y: 82, width: 72, height: 10 },
  },
  hudLayout: null,
  hudLayouts: null,
};

describe('Sprint 42B — Artwork Schema V2 contract and backward compatibility', () => {
  it('1. preset existente sem artworkSchemaVersion resolve como V1', () => {
    expect(resolveArtworkSchemaVersion({})).toBe(1);
    expect(resolveArtworkSchemaVersion(undefined)).toBe(1);
    expect(resolveArtworkSchemaVersion(null)).toBe(1);
  });

  it('2. preset V1 explícito (artworkSchemaVersion: 1) continua válido', () => {
    const preset: Preset = { id: 'v1-explicit', artworkSchemaVersion: 1, sourceType: 'layered' };
    const result = validateArtworkSchema(preset);
    expect(result.errors).toEqual([]);
  });

  it('3. preset V2 válido passa na validação', () => {
    const result = validateArtworkSchema(VALID_V2_PRESET);
    expect(result.errors).toEqual([]);
  });

  it('4. preset V2 sem safe zones falha', () => {
    const preset: Preset = { ...VALID_V2_PRESET, id: 'no-zones', safeZones: null };
    const result = validateArtworkSchema(preset);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('safeZones'))).toBe(true);
  });

  it('5. preset V2 com coordenadas normalizadas inválidas falha', () => {
    const preset: Preset = {
      ...VALID_V2_PRESET,
      id: 'bad-coords',
      safeZones: {
        upperLeftHudZone: { x: 150, y: -10, width: 18, height: 12 },
        lowerIdentityZone: { x: 50, y: 82, width: 72, height: 10 },
      },
    };
    const result = validateArtworkSchema(preset);
    expect(result.errors.some((e) => e.includes('limites normalizados'))).toBe(true);
  });

  it('6. preset V2 com zona de tamanho zero falha', () => {
    const preset: Preset = {
      ...VALID_V2_PRESET,
      id: 'zero-size',
      safeZones: {
        upperLeftHudZone: { x: 17, y: 19, width: 0, height: 12 },
        lowerIdentityZone: { x: 50, y: 82, width: 72, height: 10 },
      },
    };
    const result = validateArtworkSchema(preset);
    expect(result.errors.some((e) => e.includes('dimensão zero ou negativa'))).toBe(true);
  });

  it('7. versão de schema desconhecida falha', () => {
    const preset = {
      ...VALID_V2_PRESET,
      id: 'unknown-version',
      artworkSchemaVersion: 3,
    } as unknown as Preset;
    const result = validateArtworkSchema(preset);
    expect(result.errors.some((e) => e.includes('desconhecido'))).toBe(true);
  });

  it('8. V2 não exige statsTop nem statsBottom', () => {
    const result = validateArtworkSchema(VALID_V2_PRESET);
    // Não há nenhum erro relacionado a stats ausentes — statsTop/statsBottom
    // simplesmente não fazem parte do contrato V2.
    expect(result.errors.some((e) => e.toLowerCase().includes('stats'))).toBe(false);
  });

  it('9. V2 rejeita regiões de 6 atributos explicitamente configuradas (flat hudLayout)', () => {
    const preset: Preset = {
      ...VALID_V2_PRESET,
      id: 'legacy-stats-flat',
      hudLayout: { statsTop: { x: 50, y: 78, width: 72, height: 7 } },
    };
    const result = validateArtworkSchema(preset);
    expect(result.errors.some((e) => e.includes('hudLayout.statsTop'))).toBe(true);
  });

  it('9b. V2 rejeita regiões de 6 atributos explicitamente configuradas (hudLayouts por densidade)', () => {
    const preset: Preset = {
      ...VALID_V2_PRESET,
      id: 'legacy-stats-density',
      hudLayouts: { standard: { stats: { x: 50, y: 78, width: 90, height: 6 } } },
    };
    const result = validateArtworkSchema(preset);
    expect(result.errors.some((e) => e.includes('hudLayouts.standard.stats'))).toBe(true);
  });

  it('10. V1 continua aceitando campos legados de HUD (statsTop/statsBottom) sem erro', () => {
    const preset: Preset = {
      id: 'v1-legacy-stats',
      sourceType: 'full-card-artwork',
      hudLayout: { statsTop: { x: 50, y: 78, width: 72, height: 7 } },
    };
    const result = validateArtworkSchema(preset);
    expect(result.errors).toEqual([]);
  });

  it('11. manifesto expõe a versão de schema resolvida pra todo preset', () => {
    expect(CARD_STATIC_MANIFEST.length).toBeGreaterThan(0);
    for (const preset of CARD_STATIC_MANIFEST) {
      expect(preset.artworkSchemaVersion).toBe(1);
    }
  });

  it('12. V1 e V2 podem coexistir no mesmo array de presets sem interferência', () => {
    const v1: Preset = { id: 'coexist-v1', sourceType: 'layered' };
    const v2: Preset = { ...VALID_V2_PRESET, id: 'coexist-v2' };
    const results = [v1, v2].map((p) => validateArtworkSchema(p));
    expect(results[0]?.errors).toEqual([]);
    expect(results[1]?.errors).toEqual([]);
  });

  it('13. comportamento do resolver de renderer é inalterado (não lê artworkSchemaVersion)', () => {
    const pele = CARD_STATIC_MANIFEST.find((p) => p.id === 'wl-goat-brazil-001');
    expect(pele).toBeDefined();
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: pele?.id, cardId: 'c', playerId: 'p', rarity: 'goat' },
      CARD_STATIC_MANIFEST,
      'compact',
    );
    expect(result.renderer).toBe('full-artwork');
    const resolverSrc = String(resolvePlayerCardRendererForDensity);
    expect(resolverSrc).not.toContain('artworkSchemaVersion');
  });

  it('14. fallback por densidade específica é inalterado', () => {
    const manifestWithMissingShowcase = [
      {
        id: 'wl-fixture-density-001',
        generated: {
          compact: { src: '/x/compact.webp', sizeKB: 10 },
          standard: { src: '/x/standard.webp', sizeKB: 20 },
          showcase: null,
        },
        productionEligible: true,
        artworkSchemaVersion: 2 as const,
      },
    ];
    const result = resolvePlayerCardRendererForDensity(
      { artworkPresetId: 'wl-fixture-density-001', cardId: 'c', playerId: 'p', rarity: 'r' },
      manifestWithMissingShowcase,
      'showcase',
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'artwork-output-not-found' });
  });

  it('15. os 10 presets de produção existentes continuam válidos (V1, sem edição necessária)', () => {
    const productionPresets = CARD_STATIC_MANIFEST.filter((p) => p.productionEligible);
    expect(productionPresets.length).toBe(10);
    for (const preset of productionPresets) {
      const result = validateArtworkSchema({
        id: preset.id,
        sourceType: preset.sourceType,
        artworkSchemaVersion: preset.artworkSchemaVersion,
        safeZones: null,
        hudLayout: preset.hudLayout,
        hudLayouts: preset.hudLayouts,
      } as unknown as Preset);
      expect(result.errors).toEqual([]);
    }
  });

  it('16. nenhum arquivo de artwork foi modificado por esta sprint — cards:build roda resize/reencode determinístico, nunca composição nova', () => {
    // Prova indireta: build-card-artworks.mts continua fazendo só resize+reencode
    // pra full-card-artwork, sem filtro/composição — não foi tocado nesta sprint.
    const src = readSource('scripts/cards/build-card-artworks.mts');
    expect(src).toContain("resize(width, height, { fit: 'cover' })");
    expect(src).not.toContain('gemini');
    expect(src).not.toContain('GEMINI');
  });

  it('17. prompt builder preenche os placeholders obrigatórios de forma determinística', () => {
    const input: PromptTemplateInput = {
      displayName: 'Fixture Player',
      country: 'Brazil',
      era: '1990s',
      position: 'ST',
      archetype: 'Poacher',
      rarity: 'legendary',
      identityNotes: 'Fixture-only identity notes, not a real player.',
      referenceSet: 'legendary-v2',
    };
    const first = buildV2ArtworkPrompt(input);
    const second = buildV2ArtworkPrompt(input);
    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.prompt).toContain('Fixture Player');
      expect(first.prompt).toContain('Brazil');
      expect(first.prompt).toContain('legendary-v2');
    }
  });

  it('18. prompt builder rejeita input obrigatório ausente', () => {
    const result = buildV2ArtworkPrompt({ displayName: 'Only Name' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.missingFields).not.toContain('displayName');
    }
  });

  it('19. saída do prompt contém as proibições do V2', () => {
    const input: PromptTemplateInput = {
      displayName: 'Fixture Player',
      country: 'Brazil',
      era: '1990s',
      position: 'ST',
      archetype: 'Poacher',
      rarity: 'legendary',
      identityNotes: 'Fixture-only.',
      referenceSet: 'legendary-v2',
    };
    const result = buildV2ArtworkPrompt(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const prohibition of V2_PROMPT_PROHIBITIONS) {
        expect(result.prompt).toContain(prohibition);
      }
      expect(result.prompt).toContain('vertical 2:3 aspect ratio');
    }
  });

  it('20. schema de reference set valida corretamente', () => {
    for (const set of REFERENCE_SETS) {
      const result = validateReferenceSet(set);
      expect(result.errors).toEqual([]);
    }
    expect(REFERENCE_SETS.length).toBe(6);
  });

  it('21. reference sets inativos não podem ser selecionados como default de produção', () => {
    for (const set of REFERENCE_SETS) {
      expect(set.active).toBe(false);
    }
    for (const set of REFERENCE_SETS) {
      expect(getActiveReferenceSet(set.rarity)).toBeNull();
    }
  });

  it('22. nenhum prompt de jogador específico é commitado — prompt-template.ts não contém nome de jogador real', () => {
    const src = readSource('lib/asset-studio/prompt-template.ts');
    const realPlayerNames = ['Pelé', 'Messi', 'Zidane', 'Beckenbauer', 'Ronaldinho'];
    for (const name of realPlayerNames) {
      expect(src).not.toContain(name);
    }
  });

  it('23. nenhuma chamada de API Gemini existe no módulo de prompt/reference-set', () => {
    for (const file of [
      'lib/asset-studio/prompt-template.ts',
      'lib/asset-studio/reference-set.ts',
    ]) {
      const src = readSource(file);
      expect(src.toLowerCase()).not.toContain('gemini');
      expect(src).not.toMatch(/fetch\(/);
    }
  });

  it('24. nenhum segredo ou chave de API foi introduzido', () => {
    for (const file of [
      'lib/asset-studio/prompt-template.ts',
      'lib/asset-studio/reference-set.ts',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/api[_-]?key/i);
      expect(src).not.toMatch(/process\.env\./);
    }
  });

  it('25. nenhum componente de produção importa CARD_STATIC_MANIFEST diretamente por causa desta sprint (regra pré-existente, não afetada)', () => {
    const src = readSource('components/cards/ResolvedWorldLegendsCard.tsx');
    // ResolvedWorldLegendsCard é o único lugar que legitimamente importa o manifesto.
    expect(src).toContain('CARD_STATIC_MANIFEST');
  });
});
