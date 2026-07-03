'use client';

import { BookOpen } from 'lucide-react';
import { useAlbums } from '@/hooks/use-query';
import { Card, CardContent, Progress, Badge, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

const FLAG: Record<string, string> = { BR: '🇧🇷', AR: '🇦🇷', DE: '🇩🇪', NL: '🇳🇱', FR: '🇫🇷', IT: '🇮🇹', PT: '🇵🇹' };

export function AlbumPage() {
  const { data: albums, isLoading } = useAlbums();
  const completed = albums?.filter((a) => a.completedAt) ?? [];
  const ongoing   = albums?.filter((a) => !a.completedAt).sort((a, b) =>
    b.ownedCards / b.totalCards - a.ownedCards / a.totalCards
  ) ?? [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Álbum de Coleção</h1>
        {albums && (
          <span className="text-xs text-muted-foreground">{completed.length}/{albums.length} completos</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Complete álbuns para ganhar recompensas exclusivas — fragmentos, packs e badges de prestígio.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          {completed.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completos ✅</h2>
              <div className="space-y-2">
                {completed.map((a) => (
                  <Card key={a.id} className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{FLAG[a.nation] ?? '🌍'}</span>
                        <div>
                          <p className="font-semibold">{a.name}</p>
                          <Badge variant="default" className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30">
                            ✓ Completo
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Em andamento</h2>
            <div className="space-y-2">
              {ongoing.map((a) => {
                const pct = a.ownedCards / a.totalCards;
                return (
                  <Card key={a.id} className="transition-colors hover:border-primary/30">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{FLAG[a.nation] ?? '🌍'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.ownedCards}/{a.totalCards} cartas</p>
                        </div>
                        <span className={cn(
                          'text-sm font-black',
                          pct >= 0.8 ? 'text-green-400' : pct >= 0.5 ? 'text-yellow-400' : 'text-muted-foreground'
                        )}>
                          {Math.round(pct * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={pct * 100}
                        indicatorClassName={pct >= 0.8 ? 'bg-green-500' : pct >= 0.5 ? 'bg-yellow-500' : undefined}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
