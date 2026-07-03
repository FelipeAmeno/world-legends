/**
 * lib/perf/audit.ts — T069
 *
 * Checklist de performance e utilitários de medição em runtime.
 *
 * Para medir no browser (DevTools Console):
 *   import('@/lib/perf/audit').then(m => m.runAudit())
 *
 * Para Lighthouse automatizado:
 *   pnpm lighthouse http://localhost:3000 --output=json
 */

// ─── Core Web Vitals (medição em runtime) ────────────────────────────────────

type Metric = { name:string; value:number; rating:'good'|'needs-improvement'|'poor' };

const THRESHOLDS = {
  FCP:  { good:1800, poor:3000 },  // First Contentful Paint
  LCP:  { good:2500, poor:4000 },  // Largest Contentful Paint
  CLS:  { good:0.1,  poor:0.25 },  // Cumulative Layout Shift
  FID:  { good:100,  poor:300  },  // First Input Delay
  TTFB: { good:800,  poor:1800 },  // Time to First Byte
  INP:  { good:200,  poor:500  },  // Interaction to Next Paint
} as const;

function rate(name: keyof typeof THRESHOLDS, value: number): Metric {
  const t = THRESHOLDS[name];
  const rating = value <= t.good ? 'good' : value <= t.poor ? 'needs-improvement' : 'poor';
  return { name, value, rating };
}

const RATING_ICON = { good:'✅', 'needs-improvement':'🟡', poor:'❌' };

export async function runAudit(): Promise<void> {
  if (typeof window === 'undefined') {
    console.log('runAudit() deve ser executado no browser.');
    return;
  }

  console.group('🏎️ World Legends — Performance Audit');

  // Navigation Timing
  const nav     = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const fcp     = performance.getEntriesByName('first-contentful-paint')[0];
  const lcp     = await new Promise<PerformanceEntry | null>(res => {
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      res(entries[entries.length - 1] ?? null);
    }).observe({ type:'largest-contentful-paint', buffered:true });
    setTimeout(() => res(null), 3000);
  });

  const metrics: Metric[] = [];

  if (nav) {
    metrics.push(rate('TTFB', nav.responseStart - nav.requestStart));
  }
  if (fcp) {
    metrics.push(rate('FCP', fcp.startTime));
  }
  if (lcp) {
    metrics.push(rate('LCP', lcp.startTime));
  }

  // CLS via PerformanceObserver
  let cls = 0;
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) cls += (entry as any).value;
    }
  }).observe({ type:'layout-shift', buffered:true });

  await new Promise(r => setTimeout(r, 1000));
  metrics.push(rate('CLS', cls));

  // Bundle sizes
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsSize = resources
    .filter(r => r.name.includes('/_next/static/') && r.name.endsWith('.js'))
    .reduce((s, r) => s + (r.decodedBodySize ?? 0), 0);
  const cssSize = resources
    .filter(r => r.name.endsWith('.css'))
    .reduce((s, r) => s + (r.decodedBodySize ?? 0), 0);

  // Resultados
  console.log('\n📊 Core Web Vitals:');
  for (const m of metrics) {
    const icon = RATING_ICON[m.rating];
    const val  = m.name === 'CLS' ? m.value.toFixed(3) : `${m.value.toFixed(0)}ms`;
    console.log(`  ${icon} ${m.name}: ${val} (${m.rating})`);
  }

  console.log('\n📦 Bundle:');
  console.log(`  JS total:  ${(jsSize / 1024).toFixed(1)} KB`);
  console.log(`  CSS total: ${(cssSize / 1024).toFixed(1)} KB`);

  const totalRequests = resources.length;
  console.log(`  Requests:  ${totalRequests}`);

  const score = metrics.filter(m => m.rating === 'good').length;
  const total = metrics.length;
  console.log(`\n🎯 Score: ${score}/${total} métricas no verde`);

  if (score < total) {
    console.log('\n💡 Sugestões:');
    for (const m of metrics.filter(m => m.rating !== 'good')) {
      console.log(`  • ${m.name}: `, SUGGESTIONS[m.name as keyof typeof SUGGESTIONS]);
    }
  }

  console.groupEnd();
}

const SUGGESTIONS = {
  FCP:  'Reduzir CSS bloqueante, usar font-display:swap, preload recursos críticos',
  LCP:  'Preload da imagem hero, usar next/image com priority, reduzir JS no caminho crítico',
  CLS:  'Definir width/height explícito em imagens, reservar espaço para conteúdo dinâmico',
  TTFB: 'Usar edge runtime ou CDN, configurar cache no servidor, ISR/SSG onde possível',
  FID:  'Reduzir JS bloqueante, dividir tarefas longas, usar requestIdleCallback',
  INP:  'Usar useTransition para updates pesados, evitar layout trashing, memoizar handlers',
} as const;

// ─── Checklist Lighthouse 95+ ─────────────────────────────────────────────────

export const LIGHTHOUSE_CHECKLIST = [
  // Performance
  { category:'Performance', check:'Fontes com font-display:swap',           status:'✅ Bebas Neue + Inter via next/font' },
  { category:'Performance', check:'Imagens em formato moderno (AVIF/WebP)', status:'✅ next/image com formats: avif, webp' },
  { category:'Performance', check:'Lazy loading de imagens',                status:'✅ next/image loading="lazy" (padrão)' },
  { category:'Performance', check:'Code splitting por rota',                status:'✅ Next.js App Router (automático)' },
  { category:'Performance', check:'Dynamic imports para componentes pesados',status:'✅ lib/perf/lazy.tsx (14 componentes)' },
  { category:'Performance', check:'Virtualização de listas longas',         status:'✅ @tanstack/react-virtual na coleção' },
  { category:'Performance', check:'Tree shaking de framer-motion',          status:'✅ optimizePackageImports em next.config' },
  { category:'Performance', check:'Source maps removidos do bundle público', status:'✅ hideSourceMaps:true no Sentry' },
  { category:'Performance', check:'Console.log removido em produção',       status:'✅ removeConsole no compiler config' },
  { category:'Performance', check:'Preconnect para APIs externas',          status:'✅ <link rel=preconnect> no layout' },
  { category:'Performance', check:'useMemo em filtros/selectors pesados',   status:'✅ collection, squad, leaderboard' },
  { category:'Performance', check:'Cache headers otimizados',               status:'✅ headers() em next.config.ts' },

  // Accessibility
  { category:'Acessibilidade', check:'aria-label em botões sem texto',      status:'✅ NotificationBell, campos de busca' },
  { category:'Acessibilidade', check:'Contraste mínimo 4.5:1',              status:'🟡 Verificar gold-text sobre dark' },
  { category:'Acessibilidade', check:'Focus visible em elementos interativos',status:'🟡 Adicionar focus-visible CSS' },

  // SEO
  { category:'SEO', check:'Title e description em todas as páginas',        status:'✅ metadata em layout.tsx' },
  { category:'SEO', check:'OpenGraph tags',                                  status:'✅ openGraph em layout.tsx' },
  { category:'SEO', check:'Manifest PWA',                                   status:'✅ /public/manifest.json' },

  // Best Practices
  { category:'Best Practices', check:'HTTPS',                                status:'✅ Vercel/Netlify automático' },
  { category:'Best Practices', check:'Security headers',                     status:'✅ X-Content-Type, Referrer-Policy' },
  { category:'Best Practices', check:'No console errors em produção',        status:'✅ removeConsole em compiler' },
] as const;

export function printChecklist(): void {
  console.group('📋 Lighthouse 95+ Checklist');
  const categories = [...new Set(LIGHTHOUSE_CHECKLIST.map(c => c.category))];
  for (const cat of categories) {
    console.group(`\n${cat}`);
    LIGHTHOUSE_CHECKLIST.filter(c => c.category === cat).forEach(c => {
      console.log(`${c.status.startsWith('✅') ? '✅' : c.status.startsWith('🟡') ? '🟡' : '❌'} ${c.check}`);
      if (!c.status.startsWith('✅')) console.log(`   → ${c.status}`);
    });
    console.groupEnd();
  }
  console.groupEnd();
}
