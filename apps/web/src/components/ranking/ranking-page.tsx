'use client';

import { Trophy, TrendingUp, Shield, Minus } from 'lucide-react';
import { useLeaderboard, useMyRankPosition } from '@/hooks/use-query';
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent, Stat } from '@/components/ui';
import { cn } from '@/lib/utils';

const DIVISION_TIERS: Record<string, { label: string; className: string; icon: string }> = {
  'World Legend': { label: 'World Legend', className: 'tier-worldlegend', icon: '👑' },
  'Lenda':        { label: 'Lenda',        className: 'tier-lenda',       icon: '⭐' },
  'Elite':        { label: 'Elite',        className: 'tier-elite',       icon: '💎' },
  'Ouro':         { label: 'Ouro',         className: 'tier-ouro',        icon: '🥇' },
  'Prata':        { label: 'Prata',        className: 'tier-prata',       icon: '🥈' },
  'Bronze':       { label: 'Bronze',       className: 'tier-bronze',      icon: '🥉' },
};

export function RankingPage() {
  const { data: rows,  isLoading: rlod } = useLeaderboard();
  const { data: myPos, isLoading: mlod } = useMyRankPosition();

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold">Ranking Global</h1>

      {/* Minha posição */}
      {mlod ? (
        <Skeleton className="h-24" />
      ) : myPos ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-2xl font-black text-primary">
                #{myPos.rank}
              </div>
              <div className="flex-1">
                <p className="font-bold">{myPos.displayName ?? myPos.username}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={myPos.division.toLowerCase().replace(' ', '') as 'default'} className={cn('text-[10px]', DIVISION_TIERS[myPos.division]?.className)}>
                    {DIVISION_TIERS[myPos.division]?.icon} {myPos.division}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Elo {myPos.eloRating}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="V" value={myPos.wins}   accent="text-green-400" />
                <Stat label="E" value={myPos.draws}  accent="text-yellow-400" />
                <Stat label="D" value={myPos.losses} accent="text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Leaderboard */}
      <Tabs defaultValue="global">
        <TabsList className="w-full">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="amigos">Amigos</TabsTrigger>
          <TabsTrigger value="historico">Temporadas</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <div className="mt-3 space-y-1">
            {rlod ? (
              Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)
            ) : (
              rows?.map((row) => {
                const isMe = row.profileId === 'usr-001';
                const tier = DIVISION_TIERS[row.division];
                return (
                  <div
                    key={row.profileId}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                      isMe ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/50',
                    )}
                  >
                    {/* Rank */}
                    <div className={cn(
                      'w-8 text-center text-sm font-black',
                      row.rank === 1 ? 'text-yellow-400' :
                      row.rank === 2 ? 'text-slate-300'  :
                      row.rank === 3 ? 'text-orange-400' : 'text-muted-foreground',
                    )}>
                      {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
                    </div>

                    {/* Avatar */}
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                      isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
                    )}>
                      {(row.displayName ?? row.username).slice(0, 2).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isMe && 'text-primary')}>
                        {row.displayName ?? row.username}
                        {isMe && <span className="ml-1 text-[10px] font-normal text-primary/70">(você)</span>}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[10px]', tier?.className)}>{tier?.icon} {row.division}</span>
                        <span className="text-[10px] text-muted-foreground">· {row.matchesPlayed}j</span>
                      </div>
                    </div>

                    {/* ELO */}
                    <span className="font-mono text-sm font-bold">{row.eloRating}</span>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="amigos">
          <div className="py-12 text-center text-sm text-muted-foreground">
            Ranking de amigos em breve.
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <div className="py-12 text-center text-sm text-muted-foreground">
            Histórico de temporadas em breve.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
