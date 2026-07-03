/**
 * next.config.ts — T069 Performance
 *
 * Configuração Next.js com todas as otimizações de performance:
 *   - withSentryConfig (source maps, release tracking)
 *   - withBundleAnalyzer (análise de bundle: ANALYZE=true pnpm build)
 *   - Image optimization (WebP/AVIF automático)
 *   - Compiler optimizations
 *   - Headers de cache
 *   - Prefetch de fontes
 */

import type { NextConfig }   from 'next';
import { withSentryConfig }  from '@sentry/nextjs';
import withBundleAnalyzer    from '@next/bundle-analyzer';

// ─── Workspace packages ───────────────────────────────────────────────────────

const WORKSPACE_PACKAGES = [
  '@world-legends/bench','@world-legends/card-evolution','@world-legends/cards',
  '@world-legends/chemistry','@world-legends/contracts','@world-legends/match-simulator',
  '@world-legends/packs','@world-legends/progression','@world-legends/shared',
  '@world-legends/squad','@world-legends/squad-rating','@world-legends/types',
  '@world-legends/persistence',
];

// ─── Base config ──────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  transpilePackages: WORKSPACE_PACKAGES,

  // ── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    esmExternals:       'loose',
    instrumentationHook:true,
    // optimizeCss:     true,   // habilitar quando critters estiver disponível
    optimizePackageImports:[
      'framer-motion',       // tree-shake Framer Motion
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@tanstack/react-virtual',
    ],
  },

  // ── Compiler ────────────────────────────────────────────────────────────────
  compiler: {
    // Remover console.log em produção (exceto warn/error)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude:['warn','error'] }
      : false,
  },

  // ── Imagens ─────────────────────────────────────────────────────────────────
  images: {
    formats:        ['image/avif', 'image/webp'],   // AVIF primeiro (melhor compressão)
    deviceSizes:    [390, 640, 828, 1080, 1200, 1920],
    imageSizes:     [16, 32, 64, 96, 128, 256],
    minimumCacheTTL:86400,                           // 24h de cache
    dangerouslyAllowSVG:   true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol:'https', hostname:'**.supabase.co' },
      { protocol:'https', hostname:'lh3.googleusercontent.com' },  // Google avatars
      { protocol:'https', hostname:'avatars.githubusercontent.com' },
    ],
  },

  // ── Headers ─────────────────────────────────────────────────────────────────
  async headers() {
    return [
      // Assets estáticos: cache longo (Next.js adiciona hash ao nome)
      {
        source:  '/_next/static/:path*',
        headers: [
          { key:'Cache-Control', value:'public, max-age=31536000, immutable' },
        ],
      },
      // Fontes: cache longo
      {
        source:  '/fonts/:path*',
        headers: [
          { key:'Cache-Control', value:'public, max-age=31536000, immutable' },
        ],
      },
      // PWA manifest
      {
        source:  '/manifest.json',
        headers: [
          { key:'Cache-Control', value:'public, max-age=3600' },
          { key:'Content-Type', value:'application/manifest+json' },
        ],
      },
      // Security headers para todas as páginas
      {
        source:  '/:path*',
        headers: [
          { key:'X-DNS-Prefetch-Control', value:'on' },
          { key:'X-Content-Type-Options', value:'nosniff' },
          { key:'Referrer-Policy',        value:'strict-origin-when-cross-origin' },
          { key:'Permissions-Policy',     value:'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // ── Redirects ────────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirecionar rotas legadas se necessário
    ];
  },

  // ── Webpack (tree-shaking adicional) ─────────────────────────────────────────
  webpack(config, { isServer }) {
    // Alias para evitar bundle duplo do lodash (se usado)
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Não bundlar módulos de node no cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:     false,
        net:    false,
        tls:    false,
        crypto: false,
      };
    }

    return config;
  },
};

// ─── Bundle Analyzer ──────────────────────────────────────────────────────────

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer:false,
});

// ─── Sentry ────────────────────────────────────────────────────────────────────

export default withSentryConfig(
  withAnalyzer(nextConfig),
  {
    org:       process.env.SENTRY_ORG     ?? 'world-legends',
    project:   process.env.SENTRY_PROJECT ?? 'world-legends-web',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent:  true,
    disableLogger: true,
    tunnelRoute:   '/monitoring',
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware:      true,
    autoInstrumentAppDirectory:    true,
    sourcemaps: { disable: true },
    release:    { create: false, finalize: false },
    telemetry:  false,
  },
);
