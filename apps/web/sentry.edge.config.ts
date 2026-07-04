/**
 * sentry.edge.config.ts — T068
 *
 * Configuração Sentry para Edge Runtime (middleware, edge API routes).
 */

import * as Sentry from '@sentry/nextjs';

const _edgeRelease = process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA;
const _edgeDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
  ...(_edgeDsn ? { dsn: _edgeDsn } : {}),
  ...(_edgeRelease ? { release: _edgeRelease } : {}),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.05,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  debug: false,
});
