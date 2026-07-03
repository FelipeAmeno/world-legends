'use client';

import { Crown, Trophy, Star, Lock } from 'lucide-react';
import { useAchievements, useCards } from '@/hooks/use-query';
import { Card, CardContent, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent, Skeleton, Stat } from '@/components/ui';
import { cn } from '@/lib/utils';

export function HallOfFamePage() {
  const { data: achievements, isLoading: alod } = useAchievements();
  const { data: cards }  = useCards();

  const goatCards = cards?.filter((c) => c.rarityCode === 'ultra') ?? []; // ultras como proxy de GOATs no mock
  const unlocked  = achievements?.filter((a) => a.unlockedAt) ?? [];
  const locked    = achievements?.filter((a) => !a.unlockedAt) ?? [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold">Hall da Fama</h1>
      </div>

      <Tabs defaultValue="conquistas">
        <TabsList className="w-full">
          <TabsTrigger value="conquistas">Conquistas</TabsTrigger>
          <TabsTrigger value="goat">GOATs</TabsTrigger>
          <TabsTrigger value="vitrine">Vitrine</TabsTrigger>
          <TabsTrigger value="prestige">Prestígio</TabsTrigger>
        </TabsList>

        {/* Conquistas */}
        <TabsContent value="conquistas" className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Stat label="Desbloqueadas" value={`${unlocked.length}/${(achievements?.length ?? 0)}`} accent="text-primary" />
            <Stat label="GOATs" value={goatCards.length} accent="text-yellow-400" />
          </div>

          {alod ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              {unlocked.map((ach) => (
                <Card key={ach.id} className="border-primary/20 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xl">🏆</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{ach.name}</p>
                          <Badge variant="default" className="text-[9px]">✓</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                        <div className="flex gap-1 mt-1">
                          {ach.rewards.map((r, i) => (
                            <Badge key={i} variant="secondary" className="text-[9px]">
                              {r.kind === 'fragments' ? `💎 ${r.amount}` : r.kind === 'credits' ? `💰 ${r.amount}` : r.kind}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {locked.map((ach) => (
                <Card key={ach.id} className="opacity-70">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xl">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{ach.name}</p>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                        <Progress value={(ach.currentValue / ach.targetValue) * 100} className="mt-2 h-1.5" />
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ach.currentValue}/{ach.targetValue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* GOATs */}
        <TabsContent value="goat" className="mt-3">
          {goatCards.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">👑</p>
              <p className="font-semibold">Nenhum GOAT ainda</p>
              <p className="text-xs text-muted-foreground mt-1">GOATs são exclusivos de conquistas específicas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {goatCards.map((card) => (
                <div key={card.id} className={cn('flex flex-col overflow-hidden rounded-xl border-2 card-rarity-ultra')}>
                  <div className="flex h-24 items-center justify-center bg-black/20 text-5xl">⚽</div>
                  <div className="bg-black/70 p-2 text-center">
                    <p className="text-xs font-bold text-white">{card.knownAs}</p>
                    <p className="text-lg font-black text-primary">{card.overall}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vitrine */}
        <TabsContent value="vitrine" className="mt-3">
          <div className="mb-3 text-xs text-muted-foreground">
            Fixe até 5 cartas para exibir no seu perfil (TC-HOF-06).
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex aspect-[3/4] items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary/40 cursor-pointer transition-colors">
                +
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Clique em um slot para fixar uma carta.</p>
        </TabsContent>

        {/* Prestígio */}
        <TabsContent value="prestige" className="mt-3">
          <div className="space-y-3">
            {[
              { label: 'Coleção Mais Completa', icon: '📚', rank: 3, value: '14/22 cartas BR 70' },
              { label: 'Mais GOATs', icon: '👑', rank: '-', value: '0 GOATs' },
              { label: 'Maior Sequência', icon: '⚡', rank: 5, value: '8 vitórias seguidas' },
              { label: 'Mais Temporadas WL', icon: '🏆', rank: '-', value: '0 temporadas' },
            ].map(({ label, icon, rank, value }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{value}</p>
                  </div>
                  <span className="font-mono font-bold text-muted-foreground">
                    {rank === '-' ? '—' : `#${rank}`}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
