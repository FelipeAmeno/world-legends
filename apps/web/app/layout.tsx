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
              <AppShell>{children}</AppShell>
            </PostHogProvider>
          </GameProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
