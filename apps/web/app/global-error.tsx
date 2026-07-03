'use client';

/**
 * app/global-error.tsx — T068
 *
 * Error Boundary global do Next.js App Router.
 * Captura erros não tratados em qualquer parte da aplicação.
 * Envia automaticamente ao Sentry.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { context: 'global_error_boundary' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          background: '#050508',
          color: '#e2ddd4',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '24px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <p
          style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: '#c9a84c',
            margin: 0,
          }}
        >
          WORLD LEGENDS
        </p>

        {/* Error icon */}
        <span style={{ fontSize: 64 }}>💥</span>

        {/* Message */}
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Algo deu errado</p>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              maxWidth: 320,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.2)',
                marginTop: 8,
                fontFamily: 'monospace',
              }}
            >
              ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexDirection: 'column',
            width: '100%',
            maxWidth: 280,
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #8c6f27, #c9a84c)',
              color: '#07080f',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            🔄 Tentar novamente
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            style={{
              padding: '14px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← Voltar ao início
          </button>
        </div>

        {/* Sentry user feedback (futuro) */}
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 16 }}>
          Erro reportado automaticamente ao nosso sistema de monitoramento.
        </p>
      </body>
    </html>
  );
}
