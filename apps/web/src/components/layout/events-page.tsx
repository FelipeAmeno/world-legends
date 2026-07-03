'use client';

import { CalendarDays, Target, Gift, Clock } from 'lucide-react';
import { useEvents } from '@/hooks/use-query';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

function timeRemaining(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms < 0) return 'Encerrado';
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  return `${h}h`;
}

export function EventsPage() {
  const { data: events, isLoading } = useEvents();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold">Eventos</h1>
      </div>

      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)
      ) : events?.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-2">🎯</p>
          <p className="text-muted-foreground text-sm">Nenhum evento ativo no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events?.map((ev) => (
            <Card key={ev.id} className={cn(
              'overflow-hidden',
              ev.status === 'active' && 'border-primary/30',
            )}>
              {/* Header do evento */}
              <div className="bg-gradient-to-r from-primary/20 to-transparent p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" className="text-[9px]">AO VIVO</Badge>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {timeRemaining(ev.endsAt)}
                      </span>
                    </div>
                    <h2 className="font-bold">{ev.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                  </div>
                  <div className="text-3xl shrink-0">
                    {ev.kind === 'season_event' ? '🏆' : ev.kind === 'double_drop' ? '⚡' : '🎯'}
                  </div>
                </div>
              </div>

              {/* Missões (se houver) */}
              {ev.missions && ev.missions.length > 0 && (
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missões</p>
                  {ev.missions.map((m) => (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-primary" />
                          {m.name}
                        </span>
                        <span className={cn(
                          'font-mono font-bold',
                          m.current >= m.target ? 'text-green-400' : 'text-muted-foreground',
                        )}>
                          {m.current >= m.target ? '✓' : `${m.current}/${m.target}`}
                        </span>
                      </div>
                      <Progress value={(m.current / m.target) * 100} />
                      <div className="flex gap-1">
                        {m.rewards.map((r, i) => (
                          <Badge key={i} variant="secondary" className="text-[9px]">
                            <Gift className="mr-0.5 h-2.5 w-2.5" />{r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}

              {/* Sem missões — banner simples */}
              {!ev.missions && (
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    Participe abrindo packs durante este evento para ganhar recompensas extras.
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
