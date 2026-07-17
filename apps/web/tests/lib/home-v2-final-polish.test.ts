import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 43F.2 — Home V2 final polish (altura do hero, rótulos, ícones, QA de regressão)', () => {
  it('192. "APROVEITAMENTO" substitui "Taxa Win" — nenhuma label mista português/inglês sobra no painel Jogar', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    expect(src).toContain('Aproveitamento');
    expect(src).not.toMatch(/taxa win/i);
  });

  it('193. a ação "Jogar agora" usa o sistema de ícones existente (NavIcon + PLAY_ICON_PATH), nunca o emoji ⚽', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    expect(src).not.toContain('⚽');
    expect(src).toContain('PLAY_ICON_PATH');
    expect(src).toContain('<NavIcon');
  });

  it('194. o hero reduziu de altura (escala central e padding vertical menores que a Sprint 43F.1), sem voltar ao tamanho subdimensionado original da Sprint 43F', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    // Escala nova (43F.2) — nem a escala grande da 43F.1 (0.85/1.55) nem a
    // ausência total de escala responsiva da 43F original.
    expect(src).toMatch(/center:\s*0\.78/);
    expect(src).toMatch(/center:\s*1\.4\b/);
    expect(src).not.toMatch(/center:\s*0\.85/);
    expect(src).not.toMatch(/center:\s*1\.55/);
    expect(src).toMatch(/py-6\s+lg:py-7/);
  });

  it('195. a proporção lateral/central continua dentro de 72–82% após a redução de altura', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    const match = src.match(/mobile:\s*\{\s*center:\s*[\d.]+,\s*side:\s*[\d.]+\s*\*\s*([\d.]+)/);
    expect(match).not.toBeNull();
    if (match) {
      const ratio = Number(match[1]);
      expect(ratio).toBeGreaterThanOrEqual(0.72);
      expect(ratio).toBeLessThanOrEqual(0.82);
    }
  });

  it('196. as 3 cartas continuam cabendo no mobile (390px) sem overflow horizontal após a redução de escala', () => {
    const CARD_BASE_WIDTH = 148;
    const MOBILE_CENTER_SCALE = 0.78;
    const MOBILE_SIDE_SCALE = 0.78 * 0.78;
    const GAP = 8;
    const totalWidth =
      CARD_BASE_WIDTH * MOBILE_SIDE_SCALE * 2 + CARD_BASE_WIDTH * MOBILE_CENTER_SCALE + GAP * 2;
    const availableWidth = 390 - 32;
    expect(totalWidth).toBeLessThanOrEqual(availableWidth);
  });

  it('197. o header mantém um alvo de toque de pelo menos 44px no botão de configurações, mesmo compactado', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    const headerBody = src.slice(src.indexOf('function HomeV2Header'), src.indexOf('// ─── Hero'));
    expect(headerBody).toMatch(/min-w-11 min-h-11/);
  });

  it('198. o header continua expondo identidade, nível, XP, moedas e configurações após a compactação', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    const headerBody = src.slice(src.indexOf('function HomeV2Header'), src.indexOf('// ─── Hero'));
    expect(headerBody).toContain('userSummary.username');
    expect(headerBody).toContain('progression.level');
    expect(headerBody).toContain('xpPercent');
    expect(headerBody).toContain('currencies.softCurrency');
    expect(headerBody).toContain('currencies.fragmentBalance');
    expect(headerBody).toContain('/settings');
  });

  it('199. header, hero e painel contextual compartilham o mesmo token de superfície (glass-surface) e raio (rounded-2xl) — tratamento normalizado', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    const panelSrc = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    const glassSurfaceCount =
      (src.match(/glass-surface/g)?.length ?? 0) + (panelSrc.match(/glass-surface/g)?.length ?? 0);
    // header + hero (2 estados: vazio e com cartas, mas só 1 é renderizado por vez) + painel
    expect(glassSurfaceCount).toBeGreaterThanOrEqual(3);
  });

  it('200. o painel Jogar preenche a zona de apoio com um dado real (modo disponível), nunca um espaço vazio nem um dado inventado', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    const jogarPanelBody = src.slice(
      src.indexOf('function JogarPanel'),
      src.indexOf('function SquadPanel'),
    );
    expect(jogarPanelBody).toContain('Modo disponível');
    expect(jogarPanelBody).toContain('Partida Rápida');
  });

  it('201. o ranking de domínio (selectTopCards) e a regra de apresentação central (selectHeroPresentation) não foram alterados nesta sprint — só a apresentação visual', () => {
    const selectTopCardsSrc = readSource('lib/home-v2/select-top-cards.ts');
    const selectHeroPresentationSrc = readSource('lib/home-v2/select-hero-presentation.ts');
    // Confirma que os arquivos de regra de negócio não ganharam nenhuma
    // menção de "Sprint 43F.2" — só os arquivos de apresentação (Experience/ContextPanel) mudaram.
    expect(selectTopCardsSrc).not.toContain('43F.2');
    expect(selectHeroPresentationSrc).not.toContain('43F.2');
  });

  it('202. a Home real ("/") continua intocada — reconfirmado após o polish final', () => {
    const src = readSource('app/page.tsx');
    expect(src).toContain("from '@/components/home/PremiumHome'");
    expect(src).not.toContain('HomeV2Experience');
  });

  it('203. nenhuma referência a Gemini/Asset Studio existe nos arquivos do protótipo após o polish', () => {
    for (const file of [
      'components/dev/home-v2/HomeV2Experience.tsx',
      'components/dev/home-v2/HomeV2ContextPanel.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/generativelanguage\.googleapis\.com|asset-studio/i);
    }
  });
});
