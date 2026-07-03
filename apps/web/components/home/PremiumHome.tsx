import { EventBanner } from './EventBanner';
import { GameGrid } from './GameGrid';
/**
 * PremiumHome — Home Screen premium do World Legends.
 *
 * Composição de componentes especializados:
 *   PlayerHeader  — glassmorphism com avatar, nome, XP, créditos, gems
 *   EventBanner   — banner rotativo com motion (auto-slide 4s)
 *   QuickStats    — barra de stats do squad em glass pill
 *   GameGrid      — hero card (Jogar) + grid 2×3 de ações
 *   PremiumBottomNav — bottom nav estilo EA FC Mobile
 *   DailyLoginTrigger — auto-popup + badge para recompensa diária
 *
 * Background: deep dark com radial gradients em camadas
 * Design: glassmorphism + blur + noise + animações de entrada staggered
 */
import { DailyLoginTrigger } from '@/components/daily-login/DailyLoginTrigger';
import { PlayerHeader } from './PlayerHeader';
import { PremiumBottomNav } from './PremiumBottomNav';
import { QuickStats } from './QuickStats';

export function PremiumHome() {
  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse 120% 40% at 50% -5%, rgba(201,168,76,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 60%  30% at 90% 60%, rgba(58,110,165,0.07) 0%, transparent 50%),
          radial-gradient(ellipse 40%  20% at 10% 80%, rgba(124,58,237,0.05) 0%, transparent 50%),
          #050508
        `,
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Scrollable content */}
      <div
        className="relative z-10 flex flex-col gap-4"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <PlayerHeader />
        <EventBanner />
        <QuickStats />
        <GameGrid />

        {/* Spacer */}
        <div className="h-2" />
      </div>

      {/* Bottom navigation */}
      <PremiumBottomNav />

      {/* Daily login — auto-popup + badge */}
      <DailyLoginTrigger />
    </div>
  );
}
