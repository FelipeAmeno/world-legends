import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 43F — Home V2 prototype (rota isolada, sem dado mock, Home real intocada)', () => {
  it('157. a rota /dev/home-v2 exige usuário autenticado antes de qualquer busca de dado (falha fechado, mesma convenção de /dev/*)', () => {
    const src = readSource('app/dev/home-v2/page.tsx');
    const userCheckIndex = src.indexOf('if (!user) redirect');
    const firstDataFetchIndex = src.indexOf('Promise.all');
    expect(userCheckIndex).toBeGreaterThan(-1);
    expect(userCheckIndex).toBeLessThan(firstDataFetchIndex);
  });

  it('158. a Home real ("/") continua importando PremiumHome — nunca foi substituída pelo protótipo', () => {
    const src = readSource('app/page.tsx');
    expect(src).toContain("from '@/components/home/PremiumHome'");
    expect(src).not.toContain('HomeV2Experience');
    expect(src).not.toContain('home-v2');
  });

  it('159. nada em app/dev/home-v2 ou components/dev/home-v2 IMPORTA dado mock (mock-events, mock-listings) — checa uso real, não menções em comentário explicando o que NÃO é usado', () => {
    const files = [
      'app/dev/home-v2/page.tsx',
      'components/dev/home-v2/HomeV2Experience.tsx',
      'components/dev/home-v2/HomeV2ContextPanel.tsx',
      'lib/home-v2/view-model.ts',
    ];
    for (const file of files) {
      const src = readSource(file);
      expect(src).not.toMatch(/from ['"].*mock-events['"]|from ['"].*mock-listings['"]/);
      expect(src).not.toMatch(/\bgetEvents\(\)|\bMOCK_EVENTS\b/);
    }
  });

  it('160. o painel Jogar nunca IMPORTA/renderiza o componente EventBanner nem calcula contagem de evento — checa import/JSX real, não a explicação em comentário do que foi removido', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    expect(src).not.toMatch(/from ['"].*EventBanner['"]|<EventBanner/);
    expect(src).not.toMatch(/\bactiveEventCount\b|\beventCount\b/);
  });

  it('161. a navegação primária expõe estado selecionado via aria-current — nunca só cor', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toContain('aria-current');
  });

  it('162. os 5 botões de navegação primária e as ações de painel são elementos <button>/<Link> nativos — focáveis/acionáveis por teclado sem JS extra', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toMatch(/<button\s/);
    expect(src).not.toContain('tabIndex={-1}');
  });

  it('163. clicar numa carta em destaque usa a rota real de detalhe (/collection/[cardId]), nunca um modal/estado novo', () => {
    const src = readSource('components/dev/home-v2/HomeV2Experience.tsx');
    expect(src).toContain('/collection/${encodeURIComponent(card.cardId)}');
  });

  it('164. a Coleção usa uma única rota canônica ("/collection") no protótipo — nunca 3 caminhos duplicados como a Home real tem hoje', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    const matches = src.match(/href="\/collection"/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('165. o painel de Mercado nunca mostra listagem/preço — a ação de comprar/vender fica sempre desabilitada', () => {
    const src = readSource('components/dev/home-v2/HomeV2ContextPanel.tsx');
    const marketPanelBody = src.slice(
      src.indexOf('function MarketPanel'),
      src.indexOf('function PacksPanel'),
    );
    expect(marketPanelBody).toContain('disabled');
    expect(marketPanelBody).not.toMatch(/preço|price|listing/i);
  });

  it('166. nenhuma carta usa density="showcase" no protótipo — checa o valor real da prop, não a explicação em comentário de por que não é usado', () => {
    for (const file of [
      'components/dev/home-v2/HomeV2Experience.tsx',
      'components/dev/home-v2/HomeV2ContextPanel.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/density=["']showcase["']/);
    }
  });

  it('167. nenhum arquivo do protótipo referencia Gemini, o Asset Studio, ou dispara cards:build', () => {
    for (const file of [
      'app/dev/home-v2/page.tsx',
      'components/dev/home-v2/HomeV2Experience.tsx',
      'components/dev/home-v2/HomeV2ContextPanel.tsx',
      'lib/home-v2/view-model.ts',
      'lib/home-v2/select-top-cards.ts',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/generativelanguage\.googleapis\.com|asset-studio|cards:build/i);
    }
  });

  it('168. a mudança em AppShell.tsx é aditiva — só acrescenta "/dev/home-v2" à lista de rotas fullscreen, nunca remove/altera uma rota existente', () => {
    const src = readSource('components/nav/AppShell.tsx');
    expect(src).toContain("'/dev/home-v2'");
    for (const existingRoute of ['/', '/enter', '/packs', '/match', '/rewards', '/login']) {
      expect(src).toContain(`'${existingRoute}'`);
    }
  });

  it('169. o protótipo nunca é referenciado por nenhum componente de navegação de produção (Sidebar, MobileHeader, PremiumBottomNav)', () => {
    for (const file of [
      'components/nav/Sidebar.tsx',
      'components/nav/MobileHeader.tsx',
      'components/home/PremiumBottomNav.tsx',
    ]) {
      const src = readSource(file);
      expect(src).not.toContain('home-v2');
    }
  });
});
