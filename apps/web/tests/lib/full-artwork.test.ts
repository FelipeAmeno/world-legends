import {
  MIN_SHOWCASE_WIDTH,
  checkArtworkResolution,
  checkCardAspectRatio,
} from '@/lib/card-static/full-artwork';
import { DEFAULT_HUD_LAYOUT, isZoneVisible, resolveHudLayout } from '@/lib/card-static/hud-layout';
import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import type { ManifestPreset } from '@/lib/card-static/resolve-artwork';
import { ARTWORK_DIMENSIONS } from '@/lib/card-static/types';
import { describe, expect, it } from 'vitest';

const SAMPLE_MANIFEST: ManifestPreset[] = [
  {
    id: 'wl-goat-brazil-001',
    generated: {
      compact: { src: '/assets/cards/generated/compact/wl-goat-brazil-001.webp', sizeKB: 81 },
      standard: { src: '/assets/cards/generated/standard/wl-goat-brazil-001.webp', sizeKB: 265 },
      showcase: null, // simula "gerado só em 2 das 3 densidades" — cenário real possível
    },
  },
];

describe('lib/card-static/resolve-artwork — resolveGeneratedArtwork', () => {
  it('artwork válido: encontra a densidade gerada', () => {
    const result = resolveGeneratedArtwork(SAMPLE_MANIFEST, 'wl-goat-brazil-001', 'compact');
    expect(result).toEqual({
      src: '/assets/cards/generated/compact/wl-goat-brazil-001.webp',
      sizeKB: 81,
    });
  });

  it('artwork ausente: presetId desconhecido retorna null (fallback)', () => {
    expect(resolveGeneratedArtwork(SAMPLE_MANIFEST, 'nao-existe', 'standard')).toBeNull();
  });

  it('artwork ausente: preset existe mas a densidade específica nunca foi gerada retorna null (fallback)', () => {
    expect(resolveGeneratedArtwork(SAMPLE_MANIFEST, 'wl-goat-brazil-001', 'showcase')).toBeNull();
  });

  it('manifesto vazio nunca lança — sempre cai no fallback', () => {
    expect(resolveGeneratedArtwork([], 'qualquer-coisa', 'compact')).toBeNull();
  });
});

describe('lib/card-static/full-artwork — checkCardAspectRatio', () => {
  it('aceita um artwork válido (2:3 exato)', () => {
    expect(checkCardAspectRatio(1200, 1800)).toEqual({ valid: true });
    expect(checkCardAspectRatio(400, 600)).toEqual({ valid: true });
    expect(checkCardAspectRatio(800, 1200)).toEqual({ valid: true });
  });

  it('aceita pequenas variações dentro da tolerância', () => {
    // 848x1264 (resolução real do primeiro asset entregue) — ligeiramente
    // fora de 2:3 exato, mas dentro da tolerância de crop de export.
    const result = checkCardAspectRatio(848, 1264);
    expect(result.valid).toBe(true);
  });

  it('rejeita proporção inválida (quadrado)', () => {
    const result = checkCardAspectRatio(1000, 1000);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain('fora de 2:3');
  });

  it('rejeita proporção invertida (retrato virado paisagem)', () => {
    const result = checkCardAspectRatio(1800, 1200);
    expect(result.valid).toBe(false);
  });

  it('rejeita dimensões zero/negativas (artwork corrompido)', () => {
    expect(checkCardAspectRatio(0, 0).valid).toBe(false);
    expect(checkCardAspectRatio(-100, 200).valid).toBe(false);
  });
});

describe('lib/card-static/full-artwork — checkArtworkResolution', () => {
  it('aceita resolução suficiente pro Showcase', () => {
    expect(checkArtworkResolution(MIN_SHOWCASE_WIDTH)).toEqual({ sufficient: true });
    expect(checkArtworkResolution(1600).sufficient).toBe(true);
  });

  it('avisa (não falha) quando a resolução é baixa', () => {
    const result = checkArtworkResolution(848);
    expect(result.sufficient).toBe(false);
    expect(result.warning).toContain('848px');
  });
});

describe('lib/card-static/hud-layout — resolveHudLayout', () => {
  it('preset sem hudLayout/hudLayouts cai no DEFAULT_HUD_LAYOUT da densidade (fallback)', () => {
    expect(resolveHudLayout(undefined, 'standard')).toEqual(DEFAULT_HUD_LAYOUT.standard);
    expect(resolveHudLayout(null, 'compact')).toEqual(DEFAULT_HUD_LAYOUT.compact);
  });

  it('preset legado (hudLayout flat) faz merge raso sobre a densidade pedida', () => {
    const resolved = resolveHudLayout({ hudLayout: { overall: { x: 5, y: 5 } } }, 'standard');
    expect(resolved.overall).toEqual({ x: 5, y: 5 });
    // resto continua vindo do default, provando que não é preciso
    // redeclarar tudo (fallback por campo).
    expect(resolved.name).toEqual(DEFAULT_HUD_LAYOUT.standard.name);
    expect(resolved.position).toEqual(DEFAULT_HUD_LAYOUT.standard.position);
  });

  it('preset novo (hudLayouts por densidade) resolve só a densidade pedida', () => {
    const resolved = resolveHudLayout(
      {
        hudLayouts: {
          compact: { overall: { x: 1, y: 1 } },
          showcase: { overall: { x: 9, y: 9 } },
        },
      },
      'showcase',
    );
    expect(resolved.overall).toEqual({ x: 9, y: 9 });
  });

  it('preset com statsTop/statsBottom sobrescreve sem quebrar os outros campos', () => {
    const resolved = resolveHudLayout(
      {
        hudLayout: {
          statsTop: { x: 50, y: 78, width: 72, height: 7 },
          statsBottom: { x: 50, y: 86, width: 72, height: 8 },
        },
      },
      'standard',
    );
    expect(resolved.statsTop).toBeDefined();
    expect(resolved.statsBottom).toBeDefined();
    expect(resolved.overall).toEqual(DEFAULT_HUD_LAYOUT.standard.overall);
  });

  it('zona com visible:false explícito é respeitada mesmo fora de Compact', () => {
    const resolved = resolveHudLayout(
      { hudLayouts: { showcase: { nickname: { x: 50, y: 90, visible: false } } } },
      'showcase',
    );
    expect(resolved.nickname?.visible).toBe(false);
  });
});

describe('lib/card-static/types — ARTWORK_DIMENSIONS (três densidades)', () => {
  it('define exatamente compact/standard/showcase', () => {
    expect(Object.keys(ARTWORK_DIMENSIONS).sort()).toEqual(['compact', 'showcase', 'standard']);
  });

  it('cada densidade é 2:3 válida', () => {
    for (const { width, height } of Object.values(ARTWORK_DIMENSIONS)) {
      expect(checkCardAspectRatio(width, height).valid).toBe(true);
    }
  });

  it('resoluções batem exatamente com o brief (400x600/800x1200/1200x1800)', () => {
    expect(ARTWORK_DIMENSIONS.compact).toEqual({ width: 400, height: 600 });
    expect(ARTWORK_DIMENSIONS.standard).toEqual({ width: 800, height: 1200 });
    expect(ARTWORK_DIMENSIONS.showcase).toEqual({ width: 1200, height: 1800 });
  });
});

describe('lib/card-static/hud-layout — nickname por densidade (preset real, formato Ronaldinho)', () => {
  // Mesmo shape de `wl-legendary-ronaldinho-001.json` — hudLayouts POR
  // densidade, nickname com `visible` explícito.
  const RONALDINHO_SHAPED_PRESET = {
    hudLayouts: {
      compact: {
        nickname: {
          x: 50,
          y: 74,
          width: 70,
          height: 4,
          fontScale: 0.6,
          align: 'center' as const,
          visible: false,
        },
      },
      standard: {
        nickname: {
          x: 50,
          y: 73.5,
          width: 70,
          height: 4,
          fontScale: 0.58,
          align: 'center' as const,
          visible: true,
        },
      },
      showcase: {
        nickname: {
          x: 50,
          y: 73.5,
          width: 70,
          height: 4,
          fontScale: 0.62,
          align: 'center' as const,
          visible: true,
        },
      },
    },
  };

  it('nickname oculto em Compact (visible: false explícito no preset)', () => {
    const resolved = resolveHudLayout(RONALDINHO_SHAPED_PRESET, 'compact');
    expect(isZoneVisible(resolved.nickname)).toBe(false);
  });

  it('nickname visível em Showcase (visible: true explícito no preset)', () => {
    const resolved = resolveHudLayout(RONALDINHO_SHAPED_PRESET, 'showcase');
    expect(isZoneVisible(resolved.nickname)).toBe(true);
    expect(resolved.nickname?.align).toBe('center');
    expect(resolved.nickname?.fontScale).toBe(0.62);
  });

  it('nickname visível em Standard também (opcional = mostra quando existe)', () => {
    const resolved = resolveHudLayout(RONALDINHO_SHAPED_PRESET, 'standard');
    expect(isZoneVisible(resolved.nickname)).toBe(true);
  });

  it('ausência de dado de nickname (string vazia/undefined) — a ZONA pode existir, mas cabe ao chamador não renderizar nada, sem reservar espaço', () => {
    // O contrato aqui é: `resolveHudLayout` só resolve POSIÇÃO — quem
    // decide se renderiza é o componente, cruzando `isZoneVisible(zone)`
    // com a EXISTÊNCIA do dado (`Boolean(card.nickname)`). Provamos que
    // a zona sozinha nunca força a exibição de algo vazio.
    const zone = resolveHudLayout(RONALDINHO_SHAPED_PRESET, 'showcase').nickname;
    const nicknameData: string | undefined = undefined;
    const shouldRender = isZoneVisible(zone) && Boolean(nicknameData);
    expect(shouldRender).toBe(false);
  });
});
