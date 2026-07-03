/**
 * sentry.server.config.ts — T068
 *
 * Configuração Sentry para o servidor Node.js (Server Components, API Routes).
 * Importado automaticamente pelo Next.js via instrumentation.ts.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn:         process.env.NEXT_PUBLIC_SENTRY_DSN,
  release:     process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,

  // Server traces (menor volume que cliente)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  enabled: process.env.NODE_ENV !== 'development' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Não logar no console em produção
  debug: false,
});
