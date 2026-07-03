'use client';

import Link from 'next/link';
import { Trophy, ShoppingBag, Zap, TrendingUp, Star, ChevronRight, BookOpen, Hammer } from 'lucide-react';
import { useMe, useCards, useMyRankPosition, useAlbums, useEvents } from '@/hooks/use-query';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Skeleton, Stat } from '@/components/ui';
import { RarityBadge } from '@/components/cards/rarity-badge';
import { cn } from '@/lib/utils';

export function DashboardView() {
  const { data: me,     isLoading: mlod } = useMe();
  const { data: cards,  isLoading: clod } = useCards();
  const { data: myRank, isLoading: rlod } = useMyRankPosition();
  const { data: albums             } = useAlbums();
  const { data: events             } = useEvents();

  const activeEvents = events?.filter((e) => e.status === 'active') ?? [];
  const bestAlbum    = albums?.sort((a, b) => (b.ownedCards / b.totalCards) - (a.ownedCards / a.totalCards))[0];
  const recentCards  = cards?.slice(0, 4) ?? [];
  const legendCount  = cards?.filter((c) => ['legendary', 'ultra', 'world_cup_hero'].includes(c.rarityCode)).length ?? 0;

  return (
    <div className="space-y-4 p-4">
      {/* Hero: saudação */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5" />
        {mlod ? (
          <Skeleton className="h-14 w-48" />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Bem-vindo de volta</p>
            <h1 className="text-2xl font-black">{me?.displayName ?? me?.username}</h1>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-primary"><Star className="h-3 w-3" /> Elo {me?.eloRating}</span>
              {myRank && <span className="text-muted-foreground">{myRank.division}</span>}
            </div>
          </>
        )}
      </div>

      {/* Stats rápidas */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {rlod ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />) : (
              <>
                <Stat label="Vitórias"  value={myRank?.wins ?? 0}   accent="text-green-400" />
                <Stat label="Empates"   value={myRank?.draws ?? 0}  accent="text-yellow-400" />
                <Stat label="Derrotas"  value={myRank?.losses ?? 0} accent="text-red-400" />
                <Stat label="Lendárias" value={legendCount}         accent="text-primary" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Eventos ativos */}
      {activeEvents.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Eventos Ativos</h2>
            <Link href="/events" className="text-xs text-primary">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {activeEvents.slice(0, 2).map((ev) => (
              <Link key={ev.id} href="/events">
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                      {ev.kind === 'season_event' ? '🏆' : ev.kind === 'double_drop' ? '⚡' : '🎯'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{ev.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{ev.description.slice(0, 60)}…</p>
                    </div>
                    <Badge variant="default" className="shrink-0 text-[9px]">AO VIVO</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Últimas cartas */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Últimas Cartas</h2>
          <Link href="/collection" className="text-xs text-primary">Ver coleção</Link>
        </div>
        {clod ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {recentCards.map((c) => (
              <Link key={c.id} href={`/collection/${c.id}`}>
                <div className={cn(
                  'relative flex flex-col rounded-lg border-2 overflow-hidden transition-transform hover:scale-105',
                  `card-rarity-${c.rarityCode.replace('_', '-')}`,
                )}>
                  <div className="flex h-16 items-center justify-center text-3xl bg-black/20">⚽</div>
                  <div className="bg-black/60 px-1 py-0.5 text-center">
                    <p className="text-[9px] font-bold text-white truncate">{c.knownAs}</p>
                    <p className="text-xs font-black text-white">{c.overall}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Progresso de álbum */}
      {bestAlbum && (
        <Link href="/album">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Álbum mais próximo — {bestAlbum.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Progress value={(bestAlbum.ownedCards / bestAlbum.totalCards) * 100} />
              <p className="text-[10px] text-muted-foreground">
                {bestAlbum.ownedCards}/{bestAlbum.totalCards} cartas
                ({Math.round((bestAlbum.ownedCards / bestAlbum.totalCards) * 100)}%)
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/packs" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">
          <ShoppingBag className="h-4 w-4" /> Abrir Pack
        </Link>
        <Link href="/ranking" className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/20">
          <Trophy className="h-4 w-4" /> Rankear
        </Link>
      </div>
    </div>
  );
}
