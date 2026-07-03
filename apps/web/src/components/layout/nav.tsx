'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Trophy, ShoppingBag, Users, Star,
  LayoutGrid, User, Sword,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { href: '/home',       icon: Home,        label: 'Início'    },
  { href: '/collection', icon: LayoutGrid,   label: 'Coleção'   },
  { href: '/squad',      icon: Sword,        label: 'Elenco'    },
  { href: '/packs',      icon: ShoppingBag,  label: 'Loja'      },
  { href: '/league',     icon: Users,        label: 'Ligas'     },
  { href: '/ranking',    icon: Trophy,       label: 'Ranking'   },
  { href: '/profile',    icon: User,         label: 'Perfil'    },
] as const;

/** Barra de navegação inferior para mobile (PWA). */
export function BottomNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_4px_hsl(var(--primary))]')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Header com logo + saldos. */
export function GameHeader({ softCurrency = 0, fragmentBalance = 0 }: {
  softCurrency?: number;
  fragmentBalance?: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold tracking-wide">WORLD LEGENDS</span>
        </div>
        {/* Saldos */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-yellow-400">
            <span>💰</span>
            <span className="font-mono font-semibold">{softCurrency.toLocaleString('pt-BR')}</span>
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span>💎</span>
            <span className="font-mono font-semibold">{fragmentBalance.toLocaleString('pt-BR')}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
