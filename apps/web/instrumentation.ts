/**
 * instrumentation.ts — T068
 *
 * Next.js Instrumentation Hook.
 * Chamado automaticamente pelo Next.js ao iniciar o servidor.
 * Importa as configs do Sentry para o ambiente correto.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
