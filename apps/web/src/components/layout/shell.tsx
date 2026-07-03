'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Trophy, ShoppingBag, Users, Star,
  LayoutGrid, User, Zap, BookOpen, Hammer,
  Crown, CalendarDays, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useUiStore } from '@/stores';

const navItems = [
  { href: '/dashboard',    icon: Home,         label: 'Início',       group: 'main'      },
  { href: '/collection',   icon: LayoutGrid,    label: 'Coleção',      group: 'main'      },
  { href: '/team',         icon: Users,         label: 'Elenco',       group: 'main'      },
  { href: '/packs',        icon: ShoppingBag,   label: 'Packs',        group: 'main'      },
  { href: '/craft',        icon: Hammer,        label: 'Craft',        group: 'main'      },
  { href: '/album',        icon: BookOpen,      label: 'Álbum',        group: 'main'      },
  { href: '/ranking',      icon: Trophy,        label: 'Ranking',      group: 'competitive'},
  { href: '/hall-of-fame', icon: Crown,         label: 'Hall da Fama', group: 'competitive'},
  { href: '/events',       icon: CalendarDays,  label: 'Eventos',      group: 'live'      },
  { href: '/profile',      icon: User,          label: 'Perfil',       group: 'account'   },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebar } = useUiStore();
  const { profile } = useAuthStore();
  const path = usePathname();

  return (
    <div className="flex h-svh bg-background">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:relative md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Star className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold tracking-widest uppercase">World Legends</span>
          <button className="ml-auto md:hidden" onClick={() => setSidebar(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Saldos */}
        {profile && (
          <div className="flex items-center gap-4 border-b border-border px-4 py-3 text-xs">
            <span className="flex items-center gap-1 text-yellow-400">
              💰 <span className="font-mono font-bold">{profile.softCurrency.toLocaleString('pt-BR')}</span>
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              💎 <span className="font-mono font-bold">{profile.fragmentBalance.toLocaleString('pt-BR')}</span>
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {['main', 'competitive', 'live', 'account'].map((group) => {
            const items = navItems.filter((i) => i.group === group);
            const label = { main: 'Jogo', competitive: 'Competitivo', live: 'Live', account: 'Conta' }[group];
            return (
              <div key={group} className="mb-4">
                <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                {items.map(({ href, icon: Icon, label: l }) => {
                  const active = path === href || path.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebar(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
                          : 'text-muted-foreground hover:bg-accent/5 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {l}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        {profile && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {(profile.displayName ?? profile.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{profile.displayName ?? profile.username}</p>
                <p className="text-[10px] text-muted-foreground">Elo {profile.eloRating}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar mobile */}
        <header className="flex h-14 items-center border-b border-border bg-card px-4 md:hidden">
          <button onClick={() => setSidebar(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="mx-auto flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold tracking-widest uppercase">World Legends</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-border bg-card px-6 py-4">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
