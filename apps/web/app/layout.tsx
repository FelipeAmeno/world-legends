/**
 * app/layout.tsx — T069 Performance
 *
 * Root layout com otimizações de performance:
 *   - next/font para Bebas Neue (zero FOUT, preload automático)
 *   - Resource hints (preconnect para APIs externas)
 *   - Viewport meta otimizado
 *   - PWA manifest
 */

import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Inter } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { LevelUpOverlay } from '@/components/flow/LevelUpOverlay';
import { RewardToast } from '@/components/flow/RewardToast';
import { AppShell } from '@/components/nav/AppShell';
import { NotificationToast } from '@/components/notifications/NotificationToast';
import { WLToast } from '@/components/ui/WLToast';
import { SessionProvider } from '@/lib/auth-context';
import { GameProvider } from '@/lib/game-context';
import { deriveAccountProgress } from '@/lib/rewards-data';
import { getUserCollection, getUserMatchStats, getUserProfile } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

// ─── Fonts (preload + subset automático) ─────────────────────────────────────

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap', // sem FOUT bloqueante
  preload: true,
  fallback: ['Impact', 'Arial Narrow', 'sans-serif'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
});

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'World Legends',
    template: '%s · World Legends',
  },
  description: 'Collectible Football Card Game — colecione as maiores lendas do futebol.',
  manifest: '/manifest.json',
  keywords: ['football', 'cards', 'game', 'legends', 'futebol'],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'World Legends',
    description: 'Collectible Football Card Game',
    siteName: 'World Legends',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050508',
  viewportFit: 'cover',
  colorScheme: 'dark',
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await getCurrentUser();

  // Resumo de perfil real (créditos/fragmentos/nível/XP) para os headers
  // globais (MobileHeader, GameTopBar) — antes lia de um GameContext
  // client-only que nunca era alimentado pelo fluxo real de auth, então
  // ficava sempre zerado/oculto. Ver SPRINT_19_REPORT.md.
  let headerSummary = { balance: 0, fragments: 0, level: 1, xp: 0, xpForNext: 105, winRate: 0 };
  if (initialUser) {
    const [profile, matchStats, collection] = await Promise.all([
      getUserProfile(initialUser.id),
      getUserMatchStats(initialUser.id),
      getUserCollection(initialUser.id),
    ]);
    const total = matchStats.wins + matchStats.draws + matchStats.losses;
    const progress = deriveAccountProgress({
      wins: matchStats.wins,
      draws: matchStats.draws,
      collectionCount: collection.length,
    });
    headerSummary = {
      balance: profile?.softCurrency ?? 0,
      fragments: profile?.fragmentBalance ?? 0,
      level: progress.level,
      xp: progress.xp,
      xpForNext: progress.xpForNext,
      winRate: total > 0 ? Math.round((matchStats.wins / total) * 100) : 0,
    };
  }

  return (
    <html lang="pt-BR" className={`${bebasNeue.variable} ${inter.variable}`}>
      <head>
        {/* Resource hints: pré-conectar a APIs externas */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preconnect para Supabase (se configurado) */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}

        {/* PWA: theme color para Android */}
        <meta name="theme-color" content="#050508" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-obsidian text-parchment font-body antialiased">
        <SessionProvider initialUser={initialUser}>
          <GameProvider>
            <PostHogProvider>
              <LevelUpOverlay />
              <RewardToast />
              <NotificationToast />
              <WLToast />
              <AppShell headerSummary={headerSummary}>{children}</AppShell>
            </PostHogProvider>
          </GameProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
