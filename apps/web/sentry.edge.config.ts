/**
 * sentry.edge.config.ts — T068
 *
 * Configuração Sentry para Edge Runtime (middleware, edge API routes).
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn:         process.env.NEXT_PUBLIC_SENTRY_DSN,
  release:     process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.05,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  debug: false,
});
