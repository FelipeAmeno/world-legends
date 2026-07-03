'use client';

import Link from 'next/link';
import { LayoutGrid, Sword, ShoppingBag, Users, Trophy, Star, ChevronRight, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { trpc } from '../../lib/trpc';

const quickLinks = [
  { href: '/collection', icon: LayoutGrid,  label: 'Coleção',    color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  { href: '/squad',      icon: Sword,        label: 'Elenco',     color: 'text-green-400',  bg: 'bg-green-500/10'  },
  { href: '/packs',      icon: ShoppingBag,  label: 'Loja',       color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { href: '/league',     icon: Users,        label: 'Ligas',      color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { href: '/ranking',    icon: Trophy,       label: 'Ranking',    color: 'text-orange-400', bg: 'bg-orange-500/10' },
] as const;

export function HomeDashboard() {
  const { data: me }  = trpc.profile.me.useQuery();
  const { data: rank } = trpc.ranking.myPosition.useQuery();
  const { data: pity } = trpc.packs.pityStatus.useQuery();

  return (
    <div className="space-y-4">
      {/* Saudação */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
        <h1 className="text-xl font-bold">
          {me?.displayName ?? me?.username ?? '…'}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Star className="h-3 w-3 text-primary" />
          <span>Elo {me?.eloRating ?? 1000}</span>
          {rank && <span>· {rank.wins}V {rank.draws}E {rank.losses}D nesta temporada</span>}
        </div>
      </div>

      {/* Pity counter — status rápido (doc 10 §15) */}
      {pity && (pity.legendaryPlus > 20 || pity.ultraPlus > 60) && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400">
          <Zap className="h-4 w-4 shrink-0" />
          <span>Proteção de sorte se aproximando — abra um pack!</span>
        </div>
      )}

      {/* Links rápidos */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map(({ href, icon: Icon, label, color, bg }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40',
              bg,
            )}
          >
            <Icon className={cn('h-5 w-5', color)} />
            <span className="text-sm font-medium">{label}</span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Ação rápida: buscar partida ranqueada */}
      <Link
        href="/ranking"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Trophy className="h-4 w-4" />
        Buscar Partida Ranqueada
      </Link>
    </div>
  );
}
