/**
 * lib/perf/config.ts — T069
 *
 * Configurações de performance centralizadas.
 * Controla limiares, debounce e comportamento do lazy loading.
 */

// ─── Debounce / Throttle ──────────────────────────────────────────────────────

export const PERF = {
  /** Debounce para inputs de busca (ms) */
  SEARCH_DEBOUNCE_MS: 200,

  /** Throttle para scroll e resize (ms) */
  SCROLL_THROTTLE_MS: 100,

  /** Debounce para auto-save do squad (ms) */
  SQUAD_SAVE_DEBOUNCE_MS: 2_000,

  /** Debounce do SyncEngine antes de enviar ao banco (ms) */
  SYNC_DEBOUNCE_MS: 800,

  // ── Virtualização ────────────────────────────────────────────────────────

  /** Linhas de buffer acima/abaixo do viewport no grid virtual */
  VIRTUAL_OVERSCAN: 4,

  /** Altura estimada de card no grid 3 colunas (px) */
  CARD_HEIGHT_GRID: 176,

  /** Altura estimada de item na lista (px) */
  CARD_HEIGHT_LIST: 72,

  /** Threshold de cards para ativar virtualização */
  VIRTUAL_THRESHOLD: 50,

  // ── IntersectionObserver ─────────────────────────────────────────────────

  /** Threshold de visibilidade para lazy loading de cards */
  LAZY_THRESHOLD: 0.05,

  /** Rootmargin para pré-carregar antes de entrar no viewport */
  LAZY_ROOT_MARGIN: '200px',

  // ── Animações ────────────────────────────────────────────────────────────

  /**
   * Reduzir animações para dispositivos low-end ou preferência do usuário.
   * Verificar: window.matchMedia('(prefers-reduced-motion: reduce)').matches
   */
  REDUCED_MOTION: false,  // será sobrescrito no cliente

  /** Limitar stagger animations a N items em telas com muitos elementos */
  MAX_STAGGER_ITEMS: 20,

  /** Duração máxima de animações de entrada (ms) */
  MAX_ENTRY_DURATION_MS: 300,

  // ── Imagens ──────────────────────────────────────────────────────────────

  /** Blur placeholder size (LQIP — Low Quality Image Placeholder) */
  IMAGE_BLUR_SIZE: 8,

  /** Tamanhos padrão para next/image em grid de cards */
  CARD_IMAGE_SIZES: '(max-width:640px) 33vw, (max-width:1024px) 25vw, 16vw',
} as const;

// ─── Feature flags de performance ────────────────────────────────────────────

export const PERF_FLAGS = {
  /** Usar virtualização no grid de coleção */
  USE_VIRTUAL_COLLECTION: true,

  /** Usar dynamic import para componentes de modal */
  USE_LAZY_MODALS: true,

  /** Preload de rotas mais visitadas */
  USE_ROUTE_PREFETCH: true,

  /** Ativar Session Replay do Sentry */
  USE_SESSION_REPLAY: process.env.NODE_ENV === 'production',

  /** Ativar PostHog replay (5% das sessões) */
  USE_POSTHOG_REPLAY: process.env.NODE_ENV === 'production',
} as const;

// ─── Cache headers (para uso em API routes) ──────────────────────────────────

export const CACHE = {
  /** Dados estáticos do catálogo de cartas (muda raramente) */
  CATALOG:  'public, max-age=3600, stale-while-revalidate=86400',

  /** Dados do usuário (muda frequentemente) */
  USER:     'private, max-age=0, must-revalidate',

  /** Leaderboard (atualiza a cada 5 minutos) */
  RANKING:  'public, max-age=300, stale-while-revalidate=600',

  /** Eventos (atualiza a cada hora) */
  EVENTS:   'public, max-age=3600, stale-while-revalidate=7200',

  /** Assets estáticos imutáveis (hash no nome) */
  IMMUTABLE:'public, max-age=31536000, immutable',
} as const;

// ─── Bundle splitting hints ───────────────────────────────────────────────────

/**
 * Rotas que devem ser pré-carregadas após o primeiro load.
 * Usadas pelo Next.js prefetch automático.
 *
 * Prioridade: rotas que o usuário visita logo após o login.
 */
export const PREFETCH_ROUTES = [
  '/collection',
  '/match',
  '/packs',
] as const;
