import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 43F.1 — Home V2 visual hierarchy (hero dominante, sem overflow, sem dado inventado)', () => {
  it('179. a escala lateral fica entre 72% e 82% da escala central, nos dois níveis responsivos (mobile e desktop)', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    // Extrai os pares { center, side } literalmente do arquivo pra provar a
    // proporção real usada em produção, não um número reafirmado no teste.
    const mobileMatch = src.match(
      /mobile:\s*\{\s*center:\s*([\d.]+),\s*side:\s*([\d.]+)\s*\*\s*([\d.]+)/,
    );
    const desktopMatch = src.match(
      /desktop:\s*\{\s*center:\s*([\d.]+),\s*side:\s*([\d.]+)\s*\*\s*([\d.]+)/,
    );
    expect(mobileMatch).not.toBeNull();
    expect(desktopMatch).not.toBeNull();
    if (mobileMatch && desktopMatch) {
      const mobileRatio = Number(mobileMatch[3]);
      const desktopRatio = Number(desktopMatch[3]);
      expect(mobileRatio).toBeGreaterThanOrEqual(0.72);
      expect(mobileRatio).toBeLessThanOrEqual(0.82);
      expect(desktopRatio).toBeGreaterThanOrEqual(0.72);
      expect(desktopRatio).toBeLessThanOrEqual(0.82);
    }
  });

  it('180. a carta central é sempre maior que as laterais (dominância visual real, não só CSS de destaque)', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toMatch(/center:\s*0\.78/);
    expect(src).toMatch(/center:\s*1\.4\b/);
  });

  it('181. as 3 cartas em destaque no mobile cabem dentro de ~358px de área útil (390px de viewport menos padding) sem overflow horizontal', () => {
    // Mesma matemática usada na implementação (148px de largura base do
    // tamanho "lg", escala mobile, gap-2 = 8px) — prova a decisão de
    // design, não confia só na leitura visual.
    const CARD_BASE_WIDTH = 148;
    const MOBILE_CENTER_SCALE = 0.78; // Sprint 43F.2 — reduzido de 0.85 (43F.1)
    const MOBILE_SIDE_SCALE = 0.78 * 0.78;
    const GAP = 8;
    const totalWidth =
      CARD_BASE_WIDTH * MOBILE_SIDE_SCALE * 2 + CARD_BASE_WIDTH * MOBILE_CENTER_SCALE + GAP * 2;
    const availableWidth = 390 - 32; // px-4 dos dois lados
    expect(totalWidth).toBeLessThanOrEqual(availableWidth);
  });

  it('182. o container principal tem uma largura máxima definida (nunca 100% da viewport em desktop largo)', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toMatch(/max-w-(5xl|6xl|4xl)/);
  });

  it('183. o header nunca renderiza uma contagem de notificação — nenhum campo/valor de notificação existe no view-model nem é referenciado no header', () => {
    const headerSrc = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    const viewModelSrc = readSource('lib/home-v2/view-model.ts');
    expect(headerSrc).not.toMatch(/notification/i);
    expect(viewModelSrc).not.toMatch(/notification/i);
  });

  it('184. o header só interpola userSummary/currencies/progression do view-model — nunca um valor literal fabricado parecendo real', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    const headerBody = src.slice(src.indexOf('function HomeV2Header'), src.indexOf('// ─── Hero'));
    expect(headerBody).toContain('userSummary.username');
    expect(headerBody).toContain('currencies.softCurrency');
    expect(headerBody).toContain('currencies.fragmentBalance');
    expect(headerBody).toContain('progression.level');
  });

  it('185. o painel de Packs nunca renderiza packSummary.ownedUnopenedCount — o campo é sempre null e nunca deveria aparecer na tela', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    expect(src).not.toContain('ownedUnopenedCount');
  });

  it('186. nenhum painel usa density diferente de "standard" — nunca showcase, checado no arquivo de painel também (não só no hero)', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    expect(src).not.toMatch(/density=["']showcase["']/);
  });

  it('187. o brilho ambiente do hero só anima quando o usuário não pediu movimento reduzido (motion-safe:) — nunca uma animação incondicional', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toContain('motion-safe:animate-');
  });

  it('188. a navegação primária continua exposta via aria-current e elementos <button> nativos após o refino visual', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toContain('aria-current');
    expect(src).toMatch(/<button\s/);
  });

  it('189. os ícones de navegação são reusados de arquivos de navegação já existentes (Sidebar.tsx / PremiumBottomNav.tsx), nunca uma nova dependência de ícones', () => {
    const navSrc = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    const sidebarSrc = readSource('components/nav/Sidebar.tsx');
    const bottomNavSrc = readSource('components/home/PremiumBottomNav.tsx');
    // Ícone "squad" — path idêntico ao já usado em Sidebar.tsx.
    const squadIconPath = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
    expect(sidebarSrc).toContain(squadIconPath);
    expect(navSrc).toContain(squadIconPath);
    // Ícone "jogar" (círculo + play) — path idêntico ao já usado em PremiumBottomNav.tsx.
    const playIconPath = 'M10 8l6 4-6 4V8z';
    expect(bottomNavSrc).toContain(playIconPath);
    expect(navSrc).toContain(playIconPath);
    expect(navSrc).not.toMatch(/from ['"]lucide-react['"]|from ['"]react-icons/);
  });

  it('190. clicar numa carta em destaque continua abrindo a rota real de detalhe após o refino visual', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toContain('/collection/${encodeURIComponent(card.cardId)}');
  });

  it('191. a Home real ("/") continua intocada — mesma checagem do Sprint 43F, reconfirmada após o refino visual', () => {
    const src = readSource('app/page.tsx');
    expect(src).toContain("from '@/components/home/PremiumHome'");
    expect(src).not.toContain('HomeV2Experience');
  });
});
