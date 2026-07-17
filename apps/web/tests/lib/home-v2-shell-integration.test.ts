import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 43G — Home V2 AppShell integration (rota /dev/home-v2-shell, sem shell própria)', () => {
  it('204. a rota /dev/home-v2-shell exige usuário autenticado antes de qualquer busca de dado (falha fechado, mesma convenção de /dev/*)', () => {
    const src = readSource('app/dev/home-v2-shell/page.tsx');
    const userCheckIndex = src.indexOf('if (!user) redirect');
    const firstDataFetchIndex = src.indexOf('Promise.all');
    expect(userCheckIndex).toBeGreaterThan(-1);
    expect(userCheckIndex).toBeLessThan(firstDataFetchIndex);
  });

  it('205. a experiência integrada nunca renderiza um HomeV2Header próprio — identidade/nível/XP/moedas vêm de graça da AppShell compartilhada', () => {
    const src = readSource('components/dev/home-v2-shell/HomeV2ShellExperience.tsx');
    expect(src).not.toContain('HomeV2Header');
    expect(src).not.toMatch(/<header/);
  });

  it('206. /dev/home-v2-shell NUNCA foi acrescentada a FULLSCREEN_ROUTES — precisa renderizar dentro da AppShell compartilhada, não numa casca própria', () => {
    const src = readSource('components/nav/AppShell.tsx');
    expect(src).not.toContain('home-v2-shell');
    // As entradas existentes (incluindo a da Sprint 43F) continuam intactas — mudança aditiva, nunca removida.
    for (const existingRoute of [
      '/',
      '/enter',
      '/packs',
      '/match',
      '/rewards',
      '/login',
      '/dev/home-v2',
    ]) {
      expect(src).toContain(`'${existingRoute}'`);
    }
  });

  it('207. o hero é reusado de HomeV2Experience.tsx (HeroSection exportado), nunca reimplementado num segundo componente', () => {
    const shellSrc = readSource('components/dev/home-v2-shell/HomeV2ShellExperience.tsx');
    const experienceSrc = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(shellSrc).toMatch(
      /import\s*{[^}]*HeroSection[^}]*}\s*from\s*['"]@\/components\/dev\/home-v2\/HomeV2Experience['"]/,
    );
    expect(shellSrc).not.toMatch(/function HeroSection/);
    expect(experienceSrc).toContain('export function HeroSection');
  });

  it('208. o seletor de área da integração (HomeV2AreaSwitcher) nunca usa o layout de grid de largura total do PrimaryNav antigo — prova que não é uma segunda navegação competindo com a Sidebar/BottomNav', () => {
    const switcherSrc = readSource('components/dev/home-v2-shell/HomeV2AreaSwitcher.tsx');
    expect(switcherSrc).not.toMatch(/lg:grid-cols-5/);
    expect(switcherSrc).not.toMatch(/lg:grid\b/);
    expect(switcherSrc).toContain('role="tablist"');
  });

  it('209. os 5 painéis contextuais são reusados via HomeV2ContextPanel sem fork — mesmo componente que o protótipo fullscreen usa', () => {
    const shellSrc = readSource('components/dev/home-v2-shell/HomeV2ShellExperience.tsx');
    expect(shellSrc).toMatch(
      /import\s*{\s*HomeV2ContextPanel\s*}\s*from\s*['"]@\/components\/dev\/home-v2\/HomeV2ContextPanel['"]/,
    );
  });

  it('210. selectTopCards e selectHeroPresentation não foram alterados pela Sprint 43G — só a apresentação/casca mudou', () => {
    const selectTopCardsSrc = readSource('lib/home-v2/select-top-cards.ts');
    const selectHeroPresentationSrc = readSource('lib/home-v2/select-hero-presentation.ts');
    expect(selectTopCardsSrc).not.toContain('43G');
    expect(selectHeroPresentationSrc).not.toContain('43G');
  });

  it('211. a nova rota nunca é referenciada por nenhum componente de navegação de produção (Sidebar, MobileHeader, PremiumBottomNav) — isolada, só por URL direta, igual /dev/home-v2', () => {
    for (const file of [
      'components/nav/Sidebar.tsx',
      'components/nav/MobileHeader.tsx',
      'components/home/PremiumBottomNav.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toContain('home-v2-shell');
    }
  });

  it('212. a Home real ("/") continua importando PremiumHome — nunca foi substituída pela integração da Sprint 43G', () => {
    const src = readSource('app/page.tsx');
    expect(src).toContain("from '@/components/home/PremiumHome'");
    expect(src).not.toContain('HomeV2ShellExperience');
    expect(src).not.toContain('home-v2-shell');
  });

  it('213. nenhum arquivo da integração importa dado mock (mock-events, mock-listings)', () => {
    for (const file of [
      'app/dev/home-v2-shell/page.tsx',
      'components/dev/home-v2-shell/HomeV2ShellExperience.tsx',
      'components/dev/home-v2-shell/HomeV2AreaSwitcher.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/from ['"].*mock-events['"]|from ['"].*mock-listings['"]/);
    }
  });

  it('214. nenhum arquivo da integração referencia Gemini, o Asset Studio, ou dispara cards:build', () => {
    for (const file of [
      'app/dev/home-v2-shell/page.tsx',
      'components/dev/home-v2-shell/HomeV2ShellExperience.tsx',
      'components/dev/home-v2-shell/HomeV2AreaSwitcher.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/generativelanguage\.googleapis\.com|asset-studio|cards:build/i);
    }
  });

  it('215. a experiência integrada nunca reimplementa Sidebar/GameTopBar/MobileHeader/PremiumBottomNav — só consome a AppShell compartilhada por composição de rota', () => {
    for (const file of [
      'components/dev/home-v2-shell/HomeV2ShellExperience.tsx',
      'components/dev/home-v2-shell/HomeV2AreaSwitcher.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/function (Sidebar|GameTopBar|MobileHeader|PremiumBottomNav)\b/);
    }
  });

  it('216. o painel contextual continua mostrando uma área por vez (useState de PrimaryArea) — nunca as 5 simultâneas', () => {
    const src = readSource('components/dev/home-v2-shell/HomeV2ShellExperience.tsx');
    expect(src).toMatch(/useState<PrimaryArea>\(['"]jogar['"]\)/);
    const panelMatches = src.match(/<HomeV2ContextPanel/g) ?? [];
    expect(panelMatches.length).toBe(1);
  });
});
