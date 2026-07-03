/**
 * sentry.client.config.ts — T068
 *
 * Configuração do Sentry para o browser (Client Components).
 * Importado automaticamente pelo Next.js via next.config.ts.
 *
 * Captura:
 *   - Erros JS não tratados
 *   - Promise rejections
 *   - React Error Boundaries
 *   - Erros de fetch/XHR
 *   - Breadcrumbs automáticos (navegação, clicks, console)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN     = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENV     = process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV;
const SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA;

Sentry.init({
  dsn: SENTRY_DSN,

  // Release para correlacionar erros com deploys
  release:     SENTRY_RELEASE,
  environment: SENTRY_ENV,

  // Performance
  tracesSampleRate:      SENTRY_ENV === 'production' ? 0.1 : 1.0,  // 10% em prod
  replaysSessionSampleRate:   0.05,   // 5% das sessões com replay
  replaysOnErrorSampleRate:   1.0,    // 100% das sessões com erro

  // Integrações
  integrations: [
    Sentry.replayIntegration({
      // Mascarar dados sensíveis no replay
      maskAllText:    false,
      blockAllMedia:  false,
      maskAllInputs:  true,    // mascarar inputs (email, senha)
    }),
    Sentry.browserTracingIntegration(),
    Sentry.breadcrumbsIntegration({
      console:   true,   // console.log como breadcrumbs
      dom:       true,   // clicks como breadcrumbs
      fetch:     true,   // requests HTTP
      history:   true,   // navegações de rota
      sentry:    true,   // eventos do próprio Sentry
      xhr:       true,   // XMLHttpRequest
    }),
  ],

  // Não capturar em dev para não poluir o Sentry
  enabled: SENTRY_ENV !== 'development' && !!SENTRY_DSN,

  // Ignorar erros irrelevantes
  ignoreErrors: [
    // Erros de rede (usuário offline)
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    'Load failed',

    // Erros de extensão de browser
    'chrome-extension',
    'moz-extension',
    '@webkit-masked-url',

    // Erros de cancelamento intencional
    'AbortError',
    'The user aborted a request',

    // Erros de ResizeObserver (inofensivos)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed',
  ],

  beforeSend(event, hint) {
    // Remover informações sensíveis dos eventos
    if (event.user) {
      delete event.user.ip_address;
    }

    // Não enviar erros de usuários que optaram por sair
    const optedOut = typeof localStorage !== 'undefined'
      && localStorage.getItem('wl-settings-v1')
      && JSON.parse(localStorage.getItem('wl-settings-v1')!).crashReports === false;

    if (optedOut) return null;

    return event;
  },

  // Tags globais presentes em todos os eventos
  initialScope: {
    tags: {
      component: 'world-legends-web',
      framework: 'next.js',
    },
  },
});
